import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { RegistrationRepository } from "./registration.repository";
import {
  WALLET_PASS_PROVIDER,
  WalletPassProvider,
} from "../wallet-pass/wallet-pass-provider";

@Injectable()
export class CardLifecycleService {
  constructor(
    private readonly registrations: RegistrationRepository,
    @Inject(WALLET_PASS_PROVIDER) private readonly wallet: WalletPassProvider,
  ) {}
  async disable(id: string) {
    const account = await this.registrations.byIdForTenant(id);
    if (!account) throw new NotFoundException("Tarjeta no encontrada.");
    await this.registrations.disableAccount(account.businessId, account.id);
    await this.registrations.disablePasses(account.businessId, account.id);
    return { disabled: true };
  }
  async reissue(id: string) {
    const account = await this.registrations.byIdForTenant(id);
    if (!account) throw new NotFoundException("Tarjeta no encontrada.");
    const cardCode = randomBytes(18).toString("base64url");
    if (account.status !== "active")
      throw new NotFoundException("Tarjeta no encontrada.");
    await this.registrations.reissue(account.businessId, account.id, cardCode);
    const passes = await this.wallet.issue(
      account.businessId,
      account.id,
      cardCode,
    );
    return { cardCode, balance: account.balance, passes };
  }
}
