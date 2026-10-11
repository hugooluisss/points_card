export interface WalletPassState {
  cardCode: string;
  mode: "stamps" | "points";
  balance: number;
  progress: number;
  goal: number | null;
  rewardAvailable: boolean;
}
export interface WalletProvider {
  updatePass(state: WalletPassState): Promise<void>;
}
export const WALLET_PROVIDER = Symbol("WALLET_PROVIDER");
