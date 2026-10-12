import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BillingReconciliationService } from "./billing-reconciliation.service";

@Injectable()
export class BillingReconciliationJob {
  constructor(private readonly reconciliation: BillingReconciliationService) {}
  @Cron(
    process.env.BILLING_RECONCILIATION_CRON ?? CronExpression.EVERY_DAY_AT_3AM,
  )
  run() {
    if (process.env.NODE_ENV !== "test") return this.reconciliation.reconcile();
  }
}
