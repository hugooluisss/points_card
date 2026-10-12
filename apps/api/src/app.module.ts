import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthController } from "./health.controller";
import { databaseOptions } from "./database/database.options";
import { TenancyModule } from "./tenancy/tenancy.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { AuthModule } from "./auth/auth.module";
import { StaffModule } from "./staff/staff.module";
import { AuditModule } from "./audit/audit.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { LedgerModule } from "./ledger/ledger.module";
import { WalletSyncModule } from "./wallet-sync/wallet-sync.module";
import { UtcTimezoneService } from "./database/utc-timezone.service";
import { validateEnvironment } from "./config/validate-environment";
import { CustomersModule } from "./customers/customers.module";
import { PrivacyModule } from "./privacy/privacy.module";
import { RegistrationModule } from "./registration/registration.module";
import { BillingModule } from "./billing/billing.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    BusinessesModule,
    TenancyModule,
    AuthModule,
    StaffModule,
    AuditModule,
    LoyaltyModule,
    LedgerModule,
    WalletSyncModule,
    CustomersModule,
    PrivacyModule,
    RegistrationModule,
    BillingModule,
    DashboardModule,
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        databaseOptions(
          config,
          config.getOrThrow<string>(
            process.env.NODE_ENV === "test"
              ? "DB_DATABASE_TEST"
              : "DB_DATABASE",
          ),
        ),
    }),
  ],
  controllers: [HealthController],
  providers: [UtcTimezoneService],
})
export class AppModule {}
