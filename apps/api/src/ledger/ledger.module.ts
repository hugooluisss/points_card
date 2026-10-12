import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { LoyaltyReward } from "../loyalty/entities/loyalty-reward.entity";
import { Branch } from "../branches/entities/branch.entity";
import { WalletSyncModule } from "../wallet-sync/wallet-sync.module";
import { AccountsService } from "./accounts.service";
import { AccumulationService } from "./accumulation.service";
import { AdjustmentService } from "./adjustment.service";
import { CardsService } from "./cards.service";
import { Clock } from "./clock";
import { ClockModule } from "./clock.module";
import { LedgerController } from "./ledger.controller";
import { LedgerRepository } from "./ledger.repository";
import { LedgerReportsService } from "./ledger-reports.service";
import { LedgerSupportService } from "./ledger-support.service";
import { LoyaltyAccount } from "./entities/loyalty-account.entity";
import { LoyaltyTransaction } from "./entities/loyalty-transaction.entity";
import { Redemption } from "./entities/redemption.entity";
import { RedemptionService } from "./redemption.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyAccount,
      LoyaltyTransaction,
      Redemption,
      LoyaltyProgram,
      LoyaltyReward,
      Branch,
    ]),
    WalletSyncModule,
    ClockModule,
    BillingModule,
  ],
  controllers: [LedgerController],
  providers: [
    LedgerRepository,
    LedgerSupportService,
    AccountsService,
    CardsService,
    LedgerReportsService,
    AccumulationService,
    RedemptionService,
    AdjustmentService,
    RolesGuard,
  ],
})
export class LedgerModule {}
