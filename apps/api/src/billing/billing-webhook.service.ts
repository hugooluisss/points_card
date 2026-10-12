import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type Stripe from "stripe";
import { Clock } from "../ledger/clock";
import { BillingRepository } from "./billing.repository";
import { BillingEventIdempotencyService } from "./billing-event-idempotency.service";
import { STRIPE_GATEWAY, StripeGateway } from "./stripe-gateway";
import { checkoutSession } from "./stripe-checkout-session";
import { subscriptionEvent } from "./stripe-subscription-event";
import { invoiceEvent } from "./stripe-invoice-event";
import { Subscription } from "./entities/subscription.entity";

@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);
  constructor(
    private readonly billing: BillingRepository,
    private readonly events: BillingEventIdempotencyService,
    private readonly clock: Clock,
    private readonly config: ConfigService,
    @Inject(STRIPE_GATEWAY) private readonly stripe: StripeGateway,
  ) {}

  async handle(raw: Buffer, signature?: string) {
    if (!signature || !raw.length)
      throw new BadRequestException("La firma del webhook no es válida.");
    let event: Stripe.Event;
    try {
      event = this.stripe.verify(raw, signature);
    } catch {
      throw new BadRequestException("La firma del webhook no es válida.");
    }
    if (!this.isHandled(event)) {
      this.logger.warn(
        `Ignoring unsupported Stripe event ${event.id} (${event.type}).`,
      );
      return { received: true };
    }
    const claim = await this.events.claim(event.id, event.type);
    if (claim !== "claimed") return { received: true };
    try {
      const result = await this.apply(event);
      await this.events.complete(event.id);
      if (result === "unknown-business")
        this.logger.warn(
          `Ignoring Stripe event ${event.id}: subscription was not found.`,
        );
      return { received: true };
    } catch (error) {
      await this.events.release(event.id);
      throw error;
    }
  }

  private isHandled(event: Stripe.Event) {
    return !!(
      checkoutSession(event) ||
      subscriptionEvent(event) ||
      invoiceEvent(event)
    );
  }

  private async apply(
    event: Stripe.Event,
  ): Promise<"applied" | "unknown-business"> {
    const session = checkoutSession(event);
    if (session) {
      const businessId =
        session.client_reference_id ?? session.metadata?.businessId;
      const current = businessId
        ? await this.billing.subscription(businessId)
        : await this.findSubscription(
            session.subscription,
            session.customer,
            session.metadata?.businessId,
          );
      if (!current) return "unknown-business";
      if (this.isStale(event, current)) return "applied";
      const customerId = this.stripeId(session.customer);
      const subscriptionId = this.stripeId(session.subscription);
      await this.billing.saveSubscription({
        businessId: current.businessId,
        status: "active",
        stripeCustomerId: customerId ?? current.stripeCustomerId,
        stripeSubscriptionId: subscriptionId ?? current.stripeSubscriptionId,
        planId: session.metadata?.planId ?? current.planId,
        graceEndsAt: null,
        canceledAt: null,
        retentionEndsAt: null,
        currentPeriodEnd: current.currentPeriodEnd,
        lastStripeEventCreated: event.created,
      });
      return "applied";
    }

    const remoteSubscription = subscriptionEvent(event);
    if (remoteSubscription) {
      const periodEnd = remoteSubscription.items?.data?.[0]?.current_period_end;
      const current = await this.findSubscription(
        remoteSubscription.id,
        remoteSubscription.customer,
        remoteSubscription.metadata?.businessId,
      );
      if (!current) return "unknown-business";
      if (this.isStale(event, current, periodEnd)) return "applied";
      const canceled =
        event.type === "customer.subscription.deleted" ||
        remoteSubscription.status === "canceled";
      const now = this.clock.now();
      const grace = Number(this.config.get("BILLING_GRACE_DAYS") ?? 7);
      const retention = Number(this.config.get("BILLING_RETENTION_DAYS") ?? 90);
      await this.billing.saveSubscription({
        businessId: current.businessId,
        status: canceled
          ? "canceled"
          : remoteSubscription.status === "past_due"
            ? "past_due"
            : "active",
        stripeSubscriptionId: remoteSubscription.id,
        currentPeriodEnd: periodEnd
          ? new Date(periodEnd * 1000)
          : current.currentPeriodEnd,
        canceledAt: canceled ? now : null,
        retentionEndsAt: canceled
          ? new Date(now.getTime() + retention * 86_400_000)
          : null,
        graceEndsAt:
          remoteSubscription.status === "past_due"
            ? new Date(now.getTime() + grace * 86_400_000)
            : null,
        lastStripeEventCreated: event.created,
      });
      return "applied";
    }

    const invoice = invoiceEvent(event);
    if (!invoice) return "applied";
    const current = await this.findSubscription(
      this.invoiceSubscriptionId(invoice),
      invoice.customer,
    );
    if (!current) return "unknown-business";
    const periodEnd = invoice.lines.data[0]?.period?.end;
    if (this.isStale(event, current, periodEnd)) return "applied";
    const paid = event.type === "invoice.paid";
    const grace = Number(this.config.get("BILLING_GRACE_DAYS") ?? 7);
    const nextPeriodEnd = periodEnd
      ? new Date(periodEnd * 1000)
      : current.currentPeriodEnd;
    await this.billing.saveSubscription({
      businessId: current.businessId,
      status: paid ? "active" : "past_due",
      currentPeriodEnd: nextPeriodEnd,
      graceEndsAt: paid
        ? null
        : new Date(this.clock.now().getTime() + grace * 86_400_000),
      canceledAt: paid ? null : current.canceledAt,
      retentionEndsAt: paid ? null : current.retentionEndsAt,
      lastStripeEventCreated: event.created,
    });
    return "applied";
  }

  private async findSubscription(
    stripeSubscriptionId?: string | Stripe.Subscription | null,
    customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null,
    businessId?: string | null,
  ): Promise<Subscription | null> {
    if (businessId) {
      const byBusiness = await this.billing.subscription(businessId);
      if (byBusiness) return byBusiness;
    }
    const subscriptionId = this.stripeId(stripeSubscriptionId);
    if (subscriptionId) {
      const bySubscription =
        await this.billing.subscriptionByStripeId(subscriptionId);
      if (bySubscription) return bySubscription;
    }
    const customerId = this.stripeId(customer);
    return customerId ? this.billing.subscriptionByCustomer(customerId) : null;
  }

  private invoiceSubscriptionId(invoice: Stripe.Invoice) {
    return invoice.parent?.type === "subscription_details"
      ? invoice.parent.subscription_details?.subscription
      : null;
  }

  private stripeId(value?: string | { id: string } | null): string | null {
    return typeof value === "string" ? value : (value?.id ?? null);
  }

  private isStale(
    event: Stripe.Event,
    current: Subscription,
    periodEnd?: number | null,
  ) {
    if (
      current.lastStripeEventCreated !== null &&
      current.lastStripeEventCreated !== undefined &&
      event.created < current.lastStripeEventCreated
    )
      return true;
    return !!(
      periodEnd &&
      current.currentPeriodEnd &&
      periodEnd * 1000 < current.currentPeriodEnd.getTime()
    );
  }
}
