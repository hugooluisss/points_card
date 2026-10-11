import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { PointsStrategy } from "./points.strategy";
import { LedgerStrategy } from "./strategy.interface";
import { StampsStrategy } from "./stamps.strategy";

export function ledgerStrategy(program: LoyaltyProgram): LedgerStrategy {
  return program.mode === "stamps"
    ? new StampsStrategy()
    : new PointsStrategy();
}
