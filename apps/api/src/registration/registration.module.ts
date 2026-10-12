import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Business } from "../businesses/entities/business.entity";
import { Customer } from "../customers/entities/customer.entity";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { PrivacyNotice } from "../privacy/entities/privacy-notice.entity";
import { Consent } from "../consents/entities/consent.entity";
import { WalletPass } from "../wallet-sync/entities/wallet-pass.entity";
import { CardRecoveryToken } from "../wallet-pass/entities/card-recovery-token.entity";
import { Clock } from "../ledger/clock";
import { ClockModule } from "../ledger/clock.module";
import { RolesGuard } from "../auth/roles.guard";
import { RegistrationRepository } from "./registration.repository";
import { RegistrationSettingsService } from "./registration-settings.service";
import { RegistrationQrService } from "./registration-qr.service";
import { PublicRegistrationService } from "./public-registration.service";
import { CardRecoveryService } from "./card-recovery.service";
import { CardLifecycleService } from "./card-lifecycle.service";
import { RegistrationController } from "./registration.controller";
import { RateLimiter } from "./rate-limiter";
import { RECOVERY_NOTIFIER } from "./recovery-notifier";
import { SimulatedRecoveryNotifier } from "./simulated-recovery-notifier";
import { WALLET_PASS_PROVIDER } from "../wallet-pass/wallet-pass-provider";
import { SimulatedWalletPassProvider } from "../wallet-pass/simulated-wallet-pass.provider";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      Customer,
      LoyaltyAccount,
      LoyaltyProgram,
      PrivacyNotice,
      Consent,
      WalletPass,
      CardRecoveryToken,
    ]),
    ClockModule,
    BillingModule,
  ],
  controllers: [RegistrationController],
  providers: [
    RegistrationRepository,
    RegistrationSettingsService,
    RegistrationQrService,
    PublicRegistrationService,
    CardRecoveryService,
    CardLifecycleService,
    RateLimiter,
    RolesGuard,
    { provide: WALLET_PASS_PROVIDER, useClass: SimulatedWalletPassProvider },
    { provide: RECOVERY_NOTIFIER, useClass: SimulatedRecoveryNotifier },
  ],
})
export class RegistrationModule {}
