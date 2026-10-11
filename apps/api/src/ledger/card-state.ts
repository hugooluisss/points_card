export function cardState(
  mode: "stamps" | "points",
  balance: number,
  goal: number | null,
  rewardCosts: number[],
) {
  return {
    progress: mode === "stamps" ? Math.min(balance, goal ?? 0) : balance,
    goal: mode === "stamps" ? goal : null,
    rewardAvailable: rewardCosts.some((cost) => balance >= cost),
  };
}
