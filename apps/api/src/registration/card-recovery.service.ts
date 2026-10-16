import { createHmac } from "node:crypto";
import {
  Inject,
  Injectable,
  NotFoundException,
  GoneException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RegistrationPass } from "@points-card/shared";
import { Clock } from "../ledger/clock";
import { RegistrationRepository } from "./registration.repository";
import {
  WALLET_PASS_PROVIDER,
  WalletPassProvider,
} from "../wallet-pass/wallet-pass-provider";

@Injectable()
export class CardRecoveryService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly config: ConfigService,
    private readonly clock: Clock,
    @Inject(WALLET_PASS_PROVIDER) private readonly wallet: WalletPassProvider,
  ) {}
  async recover(raw: string) {
    const secret =
      this.config.get<string>("JWT_REFRESH_SECRET") ??
      "development-recovery-secret";
    const hash = createHmac("sha256", secret).update(raw).digest("hex");
    const customer = await this.registrations.consumeRecoveryToken(
      hash,
      this.clock.now(),
    );
    if (!customer)
      throw new GoneException(
        "El enlace de recuperación no es válido o venció.",
      );
    const business = await this.registrations.byId(customer.businessId);
    if (!business) throw new NotFoundException("No encontramos este comercio.");
    const accounts = await this.registrations.activeCustomerAccounts(
      customer.businessId,
      customer.id,
    );
    const account = accounts[0];
    if (!account)
      throw new GoneException("No hay una tarjeta activa para recuperar.");
    const passes: RegistrationPass[] = await this.wallet.issue(
      business.id,
      account.id,
      account.cardCode,
      await this.registrations.walletPassDetails(business.id, account.id),
    );
    return { businessName: business.name, cardCode: account.cardCode, passes };
  }
}
