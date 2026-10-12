import { ConfigService } from "@nestjs/config";
import { join } from "node:path";
import { DataSourceOptions } from "typeorm";
import { Branch } from "../branches/entities/branch.entity";
import { Business } from "../businesses/entities/business.entity";
import { StaffUser } from "../staff/entities/staff-user.entity";
import { RefreshToken } from "../auth/entities/refresh-token.entity";
import { AuditLog } from "../audit/entities/audit-log.entity";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { LoyaltyReward } from "../loyalty/entities/loyalty-reward.entity";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyTransaction } from "../ledger/entities/loyalty-transaction.entity";
import { Redemption } from "../ledger/entities/redemption.entity";
import { WalletSyncJob } from "../wallet-sync/entities/wallet-sync-job.entity";
import { Customer } from "../customers/entities/customer.entity";
import { Consent } from "../consents/entities/consent.entity";
import { PrivacyNotice } from "../privacy/entities/privacy-notice.entity";
import { WalletPass } from "../wallet-sync/entities/wallet-pass.entity";
import { CardRecoveryToken } from "../wallet-pass/entities/card-recovery-token.entity";
import { BillingEvent } from "../billing/entities/billing-event.entity";
import { Plan } from "../billing/entities/plan.entity";
import { Subscription } from "../billing/entities/subscription.entity";

export function databaseOptions(
  config: ConfigService,
  database: string,
): DataSourceOptions {
  return {
    type: "mysql",
    timezone: "Z",
    dateStrings: ["DATE"],
    host: config.getOrThrow<string>("DB_HOST"),
    port: config.getOrThrow<number>("DB_PORT"),
    username: config.getOrThrow<string>("DB_USERNAME"),
    password: config.getOrThrow<string>("DB_PASSWORD"),
    database,
    entities: [
      Business,
      Branch,
      StaffUser,
      RefreshToken,
      AuditLog,
      LoyaltyProgram,
      LoyaltyReward,
      LoyaltyAccount,
      LoyaltyTransaction,
      Redemption,
      WalletSyncJob,
      Customer,
      Consent,
      PrivacyNotice,
      WalletPass,
      CardRecoveryToken,
      BillingEvent,
      Plan,
      Subscription,
    ],
    migrations: [join(__dirname, "migrations", "*{.ts,.js}")],
    synchronize: false,
  };
}
