import { Injectable, NotFoundException } from "@nestjs/common";
import { BillingRepository } from "./billing.repository";

@Injectable()
export class BillingOverviewService {
  constructor(private readonly billing: BillingRepository) {}
  async get() {
    const businessId = this.billing.businessId();
    const [sub, plans, usage] = await Promise.all([
      this.billing.subscription(businessId),
      this.billing.activePlans(),
      this.billing.usage(businessId),
    ]);
    if (!sub)
      throw new NotFoundException(
        "No encontramos la suscripción del comercio.",
      );
    const dto = (plan: NonNullable<typeof sub>["plan"]) => ({
      id: plan.id,
      name: plan.name,
      priceMonthly: Number(plan.priceMonthly),
      currency: "MXN" as const,
      maxBranches: plan.maxBranches,
      maxStaff: plan.maxStaff,
      maxCards: plan.maxCards,
    });
    return {
      status: sub.status,
      plan: dto(sub.plan),
      trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      graceEndsAt: sub.graceEndsAt?.toISOString() ?? null,
      usage,
      plans: plans.map(dto),
    };
  }
}
