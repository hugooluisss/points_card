export interface WalletPassProvider {
  issue(
    businessId: string,
    accountId: string,
    cardCode: string,
  ): Promise<{ platform: "google" | "apple"; saveUrl: string }[]>;
}
export const WALLET_PASS_PROVIDER = Symbol("WALLET_PASS_PROVIDER");
