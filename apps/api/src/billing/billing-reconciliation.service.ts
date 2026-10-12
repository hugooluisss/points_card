import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Clock } from "../ledger/clock";
import { BillingRepository } from "./billing.repository";
import { STRIPE_GATEWAY, StripeGateway } from "./stripe-gateway";

@Injectable()
export class BillingReconciliationService {
  constructor(
    private readonly billing: BillingRepository,
    private readonly config: ConfigService,
    private readonly clock: Clock,
    @Inject(STRIPE_GATEWAY) private readonly stripe: StripeGateway,
  ) {}
  async reconcile() {
    if (!this.stripe.configured()) return;
    await this.billing.migrateExpiredTrials(
      Number(this.config.get("BILLING_GRACE_DAYS") ?? 7),
    );
    for (const local of await this.billing.subscriptionsForReconciliation()) {
      if (!local.stripeSubscriptionId) continue;
      const remote = await this.stripe.retrieveSubscription(
        local.stripeSubscriptionId,
      );
      const status =
        remote.status === "past_due"
          ? "past_due"
          : remote.status === "canceled"
            ? "canceled"
            : "active";
      const remoteEnd = (remote as unknown as { current_period_end?: number })
        .current_period_end;
      if (
        status !== local.status ||
        (remoteEnd && remoteEnd * 1000 !== local.currentPeriodEnd?.getTime())
      )
        await this.billing.saveSubscription({
          businessId: local.businessId,
          status,
          currentPeriodEnd: remoteEnd
            ? new Date(remoteEnd * 1000)
            : local.currentPeriodEnd,
          graceEndsAt:
            status === "past_due"
              ? new Date(
                  this.clock.now().getTime() +
                    Number(this.config.get("BILLING_GRACE_DAYS") ?? 7) *
                      86_400_000,
                )
              : null,
          canceledAt: status === "canceled" ? this.clock.now() : null,
          retentionEndsAt:
            status === "canceled"
              ? new Date(
                  this.clock.now().getTime() +
                    Number(this.config.get("BILLING_RETENTION_DAYS") ?? 90) *
                      86_400_000,
                )
              : null,
        });
    }
  }
}
