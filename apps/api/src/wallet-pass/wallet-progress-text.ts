import { WalletPassDetails } from "./wallet-pass-provider";

export function walletProgressText(state: WalletPassDetails): string {
  const progress =
    state.mode === "stamps"
      ? `${state.progress} of ${state.goal ?? 0}`
      : String(state.balance);
  return state.rewardAvailable ? `${progress} · Reward available` : progress;
}
