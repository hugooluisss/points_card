import { Injectable } from "@nestjs/common";
import { GoogleWalletClient } from "./google-wallet.client";
import { WalletPassDetails, WalletPassProvider } from "./wallet-pass-provider";
import { walletProgressText } from "./wallet-progress-text";

@Injectable()
export class GoogleWalletPassProvider implements WalletPassProvider {
  constructor(private readonly client: GoogleWalletClient) {}

  private object(cardCode: string, details: WalletPassDetails) {
    return {
      id: this.client.id(cardCode),
      classId: this.client.id(details.mode),
      state: "ACTIVE",
      barcode: { type: "QR_CODE", value: cardCode },
      cardTitle: {
        defaultValue: {
          language: "en-US",
          value: details.mode === "points" ? "Points" : "Stamps",
        },
      },
      header: {
        defaultValue: {
          language: "en-US",
          value:
            details.mode === "points" ? "Points balance" : "Stamp progress",
        },
      },
      textModulesData: [
        {
          id: "progress",
          header: "Progress",
          body: walletProgressText(details),
        },
      ],
    };
  }

  async issue(
    _businessId: string,
    _accountId: string,
    cardCode: string,
    details: WalletPassDetails,
  ) {
    const object = this.object(cardCode, details);
    await this.client.request(
      `${this.client.apiUrl}/genericClass`,
      "POST",
      { id: object.classId },
      true,
    );
    await this.client.request(
      `${this.client.apiUrl}/genericObject`,
      "POST",
      object,
      true,
    );
    return [
      {
        platform: "google" as const,
        saveUrl: await this.client.saveUrl(object),
      },
    ];
  }
}
