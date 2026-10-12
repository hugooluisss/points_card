import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { StripeGateway } from "./stripe-gateway";
import { STRIPE_GATEWAY } from "./stripe-gateway";
import { Inject } from "@nestjs/common";
import { BillingRepository } from "./billing.repository";

@Injectable()
export class BillingCheckoutService {
  constructor(
    private readonly billing: BillingRepository,
    @Inject(STRIPE_GATEWAY) private readonly stripe: StripeGateway,
  ) {}
  async checkout(planId: string) {
    if (!this.stripe.configured())
      throw new ServiceUnavailableException(
        "El cobro aún no está configurado.",
      );
    const businessId = this.billing.businessId();
    const plan = await this.billing.plan(planId);
    if (!plan)
      throw new ConflictException("El plan seleccionado no está disponible.");
    if (!plan.stripePriceId)
      throw new ConflictException(
        "Este plan aún no está configurado para cobro.",
      );
    const sub = await this.billing.subscription(businessId);
    if (!sub)
      throw new ConflictException(
        "No encontramos la suscripción del comercio.",
      );
    const customerId =
      sub.stripeCustomerId ?? (await this.stripe.createCustomer(businessId));
    if (!sub.stripeCustomerId)
      await this.billing.saveSubscription({
        businessId,
        stripeCustomerId: customerId,
      });
    const url = await this.stripe.checkout(
      customerId,
      plan.stripePriceId,
      businessId,
      plan.id,
    );
    return { url };
  }
}
