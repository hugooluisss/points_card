import { BadRequestException } from "@nestjs/common";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { PointsStrategy } from "./points.strategy";
import { StampsStrategy } from "./stamps.strategy";

describe("ledger strategies", () => {
  it("adds one stamp and floors points while rejecting less than one", () => {
    const program = {
      mode: "points",
      pointsPerCurrencyUnit: "2.5",
    } as LoyaltyProgram;
    expect(new StampsStrategy().amount(program)).toBe(1);
    expect(new PointsStrategy().amount(program, 2.2)).toBe(5);
    expect(() => new PointsStrategy().amount(program, 0.1)).toThrow(
      BadRequestException,
    );
    expect(new PointsStrategy().canRedeem(3, 3)).toBe(true);
  });
});
