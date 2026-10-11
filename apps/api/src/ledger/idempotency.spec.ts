import { ConflictException } from "@nestjs/common";
import { LoyaltyTransaction } from "./entities/loyalty-transaction.entity";
import { assertIdempotencyReplay } from "./idempotency";

describe("assertIdempotencyReplay", () => {
  it("accepts an exact replay and rejects a different card operation", () => {
    const previous = {
      type: "accumulate",
      amount: 1,
      rewardId: null,
      reversesTransactionId: null,
      purchaseAmount: null,
      reference: null,
    } as LoyaltyTransaction;
    expect(() =>
      assertIdempotencyReplay(previous, "card-a", {
        type: "accumulate",
        cardCode: "card-a",
        amount: 1,
      }),
    ).not.toThrow();
    expect(() =>
      assertIdempotencyReplay(previous, "card-b", {
        type: "accumulate",
        cardCode: "card-a",
        amount: 1,
      }),
    ).toThrow(ConflictException);
  });
});
