import { cardState } from "./card-state";

describe("cardState", () => {
  it("caps stamp progress at the goal and reports available rewards", () => {
    expect(cardState("stamps", 7, 5, [8, 5])).toEqual({
      progress: 5,
      goal: 5,
      rewardAvailable: true,
    });
  });
  it("uses the full points balance and omits a goal", () => {
    expect(cardState("points", 7, null, [8])).toEqual({
      progress: 7,
      goal: null,
      rewardAvailable: false,
    });
  });
});
