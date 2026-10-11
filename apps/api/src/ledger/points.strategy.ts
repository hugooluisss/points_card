import { BadRequestException } from "@nestjs/common";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { LedgerStrategy } from "./strategy.interface";

export class PointsStrategy implements LedgerStrategy {
  amount(program: LoyaltyProgram, purchaseAmount?: number): number {
    const amount = Math.floor(
      (purchaseAmount ?? 0) * Number(program.pointsPerCurrencyUnit),
    );
    if (amount < 1)
      throw new BadRequestException("El monto de compra no genera puntos.");
    return amount;
  }
  canRedeem(balance: number, cost: number): boolean {
    return balance >= cost;
  }
}
