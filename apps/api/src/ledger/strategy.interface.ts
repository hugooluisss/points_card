import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";

export interface LedgerStrategy {
  amount(program: LoyaltyProgram, purchaseAmount?: number): number;
  canRedeem(balance: number, cost: number): boolean;
}
