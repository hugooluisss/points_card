import { Injectable } from "@nestjs/common";
import { GoogleWalletClient } from "../wallet-pass/google-wallet.client";
import { WalletProvider, WalletPassState } from "./wallet-provider";
import { walletProgressText } from "../wallet-pass/wallet-progress-text";

@Injectable()
export class GoogleWalletProvider implements WalletProvider {
  constructor(private readonly client: GoogleWalletClient) {}

  async updatePass(state: WalletPassState) {
    await this.client.request(
      `${this.client.apiUrl}/genericObject/${this.client.id(state.cardCode)}`,
      "PATCH",
      {
        textModulesData: [
          {
            id: "progress",
            header: "Progress",
            body: walletProgressText(state),
          },
        ],
      },
    );
  }
}
