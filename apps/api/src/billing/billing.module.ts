import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClockModule } from "../ledger/clock.module";
import { RolesGuard } from "../auth/roles.guard";
import { BillingController } from "./billing.controller";
import { BillingRepository } from "./billing.repository";
import { BillingOverviewService } from "./billing-overview.service";
import { BillingAccessService } from "./billing-access.service";
import { BillingCheckoutService } from "./billing-checkout.service";
import { BillingPortalService } from "./billing-portal.service";
import { BillingWebhookService } from "./billing-webhook.service";
import { BillingEventIdempotencyService } from "./billing-event-idempotency.service";
import { BillingReconciliationService } from "./billing-reconciliation.service";
import { BillingReconciliationJob } from "./billing-reconciliation.job";
import { PlanLimitsService } from "./plan-limits.service";
import { BillingEvent } from "./entities/billing-event.entity";
import { Plan } from "./entities/plan.entity";
import { Subscription } from "./entities/subscription.entity";
import { FakeStripeGateway } from "./fake-stripe.gateway";
import { RealStripeGateway } from "./real-stripe.gateway";
import { STRIPE_GATEWAY } from "./stripe-gateway";

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingEvent, Plan, Subscription]),
    ClockModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [BillingController],
  providers: [
    BillingRepository,
    BillingOverviewService,
    BillingAccessService,
    BillingCheckoutService,
    BillingPortalService,
    BillingWebhookService,
    BillingEventIdempotencyService,
    BillingReconciliationService,
    BillingReconciliationJob,
    PlanLimitsService,
    RolesGuard,
    RealStripeGateway,
    FakeStripeGateway,
    {
      provide: STRIPE_GATEWAY,
      inject: [ConfigService, RealStripeGateway, FakeStripeGateway],
      useFactory: (
        _config: ConfigService,
        real: RealStripeGateway,
        fake: FakeStripeGateway,
      ) =>
        process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
          ? real
          : fake,
    },
  ],
  exports: [
    PlanLimitsService,
    BillingAccessService,
    BillingRepository,
    STRIPE_GATEWAY,
  ],
})
export class BillingModule {}
