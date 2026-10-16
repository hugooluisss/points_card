import { Injectable } from "@nestjs/common";
import { WalletPassDetails, WalletPassProvider } from "./wallet-pass-provider";

@Injectable()
export class SimulatedWalletPassProvider implements WalletPassProvider {
  async issue(
    _businessId: string,
    _accountId: string,
    cardCode: string,
    _details: WalletPassDetails,
  ) {
    // shortcut: fake save links until F0 validates real Google and Apple providers.
    const passes = (["google", "apple"] as const).map((platform) => ({
      platform,
      saveUrl: `https://${platform}.wallet.example/save/${cardCode}`,
    }));
    return passes;
  }
}
