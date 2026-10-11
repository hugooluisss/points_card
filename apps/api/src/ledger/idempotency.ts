import { ConflictException } from "@nestjs/common";
import { LoyaltyTransaction } from "./entities/loyalty-transaction.entity";

export interface IdempotencyExpectation {
  type: string;
  cardCode?: string;
  rewardId?: string | null;
  amount?: number;
  purchaseAmount?: string | null;
  reversesTransactionId?: string | null;
  reference?: string | null;
}

export function assertIdempotencyReplay(
  previous: LoyaltyTransaction,
  cardCode: string | null,
  expected: IdempotencyExpectation,
): void {
  if (
    !cardCode ||
    previous.type !== expected.type ||
    (expected.cardCode !== undefined && cardCode !== expected.cardCode) ||
    (previous.rewardId ?? null) !== (expected.rewardId ?? null) ||
    (expected.amount !== undefined && previous.amount !== expected.amount) ||
    (expected.purchaseAmount !== undefined &&
      String(previous.purchaseAmount ?? "") !==
        String(expected.purchaseAmount ?? "")) ||
    (expected.reference !== undefined &&
      (previous.reference ?? null) !== expected.reference) ||
    (previous.reversesTransactionId ?? null) !==
      (expected.reversesTransactionId ?? null)
  ) {
    throw new ConflictException(
      "La clave de idempotencia ya se usó con otra operación.",
    );
  }
}
