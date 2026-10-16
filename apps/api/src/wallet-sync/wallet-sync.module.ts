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
import { GoogleWalletProvider } from "./google-wallet.provider";
import { GoogleWalletModule } from "../wallet-pass/google-wallet.module";
import { GOOGLE_WALLET_PROVIDER_NAME } from "../wallet-pass/wallet-pass-provider";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletSyncJob, LoyaltyAccount, LoyaltyProgram]),
    GoogleWalletModule,
  ],
  controllers: [WalletSyncController],
  providers: [
    WalletSyncRepository,
    WalletSyncService,
    WalletSyncWorker,
    GoogleWalletProvider,
    SimulatedWalletProvider,
    RolesGuard,
    {
      provide: WALLET_PROVIDER,
      inject: [ConfigService, SimulatedWalletProvider, GoogleWalletProvider],
      useFactory: (
        config: ConfigService,
        simulated: SimulatedWalletProvider,
        google: GoogleWalletProvider,
      ) =>
        config.get("WALLET_PASS_PROVIDER") === GOOGLE_WALLET_PROVIDER_NAME
          ? google
          : simulated,
    },
  ],
  exports: [WalletSyncRepository],
})
export class WalletSyncModule {}
