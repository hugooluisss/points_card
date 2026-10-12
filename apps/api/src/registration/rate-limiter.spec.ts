import { RateLimiter } from "./rate-limiter";

describe("registration rate limiter", () => {
  it("allows ten requests per key in an hour and rejects the next", () => {
    const limiter = new RateLimiter();
    for (let index = 0; index < 10; index++)
      limiter.assertAllowed("ip|store", 1_000);
    expect(() => limiter.assertAllowed("ip|store", 1_000)).toThrow(
      "Demasiados registros",
    );
    expect(() => limiter.assertAllowed("other|store", 1_000)).not.toThrow();
    expect(() => limiter.assertAllowed("ip|store", 3_602_000)).not.toThrow();
  });
});
