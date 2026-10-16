export interface WalletPassDetails {
  mode: "stamps" | "points";
  balance: number;
  progress: number;
  goal: number | null;
  rewardAvailable: boolean;
}

export const GOOGLE_WALLET_PROVIDER_NAME = "google";

export interface WalletPassProvider {
  issue(
    businessId: string,
    accountId: string,
    cardCode: string,
    details: WalletPassDetails,
  ): Promise<{ platform: "google" | "apple"; saveUrl: string }[]>;
}
export const WALLET_PASS_PROVIDER = Symbol("WALLET_PASS_PROVIDER");
