import { Injectable, Logger } from "@nestjs/common";
import { WalletPassState, WalletProvider } from "./wallet-provider";

@Injectable()
export class SimulatedWalletProvider implements WalletProvider {
  private readonly logger = new Logger(SimulatedWalletProvider.name);
  async updatePass(state: WalletPassState): Promise<void> {
    if (
      process.env.NODE_ENV === "test" &&
      process.env.WALLET_PROVIDER_FAIL === "true"
    )
      throw new Error("Simulated Wallet provider failure");
    this.logger.log(`Pass update ${state.cardCode}: ${state.balance}`);
    // Apple and Google providers will replace this simulated provider after F0 device validation.
  }
}
