import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { TenantContext } from "../tenancy/tenant-context.service";
import { Clock } from "../ledger/clock";
import { BillingEvent } from "./entities/billing-event.entity";
import { Plan } from "./entities/plan.entity";
import { Subscription } from "./entities/subscription.entity";

@Injectable()
// Allow-listed: global plans/events; subscription and usage queries take an explicit business ID.
export class BillingRepository {
  constructor(
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(BillingEvent)
    private readonly events: Repository<BillingEvent>,
    private readonly source: DataSource,
    private readonly tenant: TenantContext,
    private readonly clock: Clock,
  ) {}
  businessId() {
    return this.tenant.getBusinessId();
  }
  subscription(id = this.businessId()) {
    return this.subscriptions.findOne({
      where: { businessId: id },
      relations: { plan: true },
    });
  }
  async allSubscriptions() {
    return this.subscriptions.find({ relations: { plan: true } });
  }
  subscriptionByCustomer(stripeCustomerId: string) {
    return this.subscriptions.findOne({
      where: { stripeCustomerId },
      relations: { plan: true },
    });
  }
  subscriptionByStripeId(stripeSubscriptionId: string) {
    return this.subscriptions.findOne({
      where: { stripeSubscriptionId },
      relations: { plan: true },
    });
  }
  activePlans() {
    return this.plans.findBy({ isActive: true });
  }
  plan(id: string) {
    return this.plans.findOneBy({ id, isActive: true });
  }
  async usage(id = this.businessId()) {
    const rows = await this.source.query(
      `SELECT
      (SELECT COUNT(*) FROM branches WHERE business_id = ?) branches,
      (SELECT COUNT(*) FROM staff_users WHERE business_id = ? AND is_active = TRUE) staff,
      (SELECT COUNT(*) FROM loyalty_accounts WHERE business_id = ? AND status <> 'disabled') cards`,
      [id, id, id],
    );
    return {
      branches: Number(rows[0].branches),
      staff: Number(rows[0].staff),
      cards: Number(rows[0].cards),
    };
  }
  async saveSubscription(
    values: Partial<Subscription> & { businessId: string },
  ) {
    const now = this.clock.now();
    const current = await this.subscriptions.findOneBy({
      businessId: values.businessId,
    });
    return this.subscriptions.save(
      this.subscriptions.create({
        ...current,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
        ...values,
      }),
    );
  }
  async claimEvent(
    id: string,
    type: string,
  ): Promise<"claimed" | "busy" | "completed"> {
    const now = this.clock.now();
    try {
      await this.events.insert({
        stripeEventId: id,
        type,
        receivedAt: now,
        processedAt: null,
        processingUntil: null,
      });
    } catch (error) {
      if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
    }
    const event = await this.events.findOneBy({ stripeEventId: id });
    if (event?.processedAt) return "completed";
    const leaseUntil = new Date(now.getTime() + 60_000);
    const result = await this.events
      .createQueryBuilder()
      .update()
      .set({ processingUntil: leaseUntil })
      .where("stripe_event_id = :id AND processed_at IS NULL", { id })
      .andWhere("(processing_until IS NULL OR processing_until <= :now)", {
        now,
      })
      .execute();
    return result.affected ? "claimed" : "busy";
  }
  async migrateExpiredTrials(graceDays: number) {
    const now = this.clock.now();
    const expired = await this.subscriptions.find({
      where: { status: "trial" },
    });
    for (const sub of expired) {
      if (sub.trialEndsAt < now) {
        const graceEndsAt = new Date(
          sub.trialEndsAt.getTime() + graceDays * 86_400_000,
        );
        await this.subscriptions.update(
          { businessId: sub.businessId },
          {
            status: "past_due",
            graceEndsAt,
          },
        );
      }
    }
  }
  processedEvent(id: string) {
    return this.events.update(
      { stripeEventId: id },
      {
        processedAt: this.clock.now(),
        processingUntil: null,
      },
    );
  }
  releaseEvent(id: string) {
    return this.events
      .createQueryBuilder()
      .update()
      .set({ processingUntil: null })
      .where("stripe_event_id = :id AND processed_at IS NULL", { id })
      .execute();
  }
  updatePlanPrice(id: string, stripePriceId: string) {
    return this.plans.update({ id }, { stripePriceId });
  }
  subscriptionsForReconciliation() {
    return this.subscriptions.find({
      where: [{ status: "active" }, { status: "past_due" }],
    });
  }
  allPlansWithoutStripePrice() {
    return this.plans
      .createQueryBuilder("plan")
      .where("plan.is_active = TRUE AND plan.stripe_price_id IS NULL")
      .getMany();
  }
}
