import { walletProgressText } from "./wallet-progress-text";

describe("walletProgressText", () => {
  it("formats stamps, points, and reward availability", () => {
    expect(
      walletProgressText({
        mode: "stamps",
        balance: 3,
        progress: 3,
        goal: 10,
        rewardAvailable: false,
      }),
    ).toBe("3 of 10");
    expect(
      walletProgressText({
        mode: "points",
        balance: 42,
        progress: 42,
        goal: null,
        rewardAvailable: true,
      }),
    ).toBe("42 · Reward available");
  });
});
