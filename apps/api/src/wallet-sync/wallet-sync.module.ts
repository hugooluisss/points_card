import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { WalletSyncJob } from "./entities/wallet-sync-job.entity";
import { SimulatedWalletProvider } from "./simulated-wallet.provider";
import { WALLET_PROVIDER } from "./wallet-provider";
import { WalletSyncController } from "./wallet-sync.controller";
import { WalletSyncRepository } from "./wallet-sync.repository";
import { WalletSyncService } from "./wallet-sync.service";
import { WalletSyncWorker } from "./wallet-sync.worker";

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletSyncJob, LoyaltyAccount, LoyaltyProgram]),
  ],
  controllers: [WalletSyncController],
  providers: [
    WalletSyncRepository,
    WalletSyncService,
    WalletSyncWorker,
    SimulatedWalletProvider,
    RolesGuard,
    { provide: WALLET_PROVIDER, useExisting: SimulatedWalletProvider },
  ],
  exports: [WalletSyncRepository],
})
export class WalletSyncModule {}
