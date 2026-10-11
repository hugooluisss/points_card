import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { LedgerStrategy } from "./strategy.interface";

export class StampsStrategy implements LedgerStrategy {
  amount(_program: LoyaltyProgram): number {
    return 1;
  }
  canRedeem(balance: number, cost: number): boolean {
    return balance >= cost;
  }
}
