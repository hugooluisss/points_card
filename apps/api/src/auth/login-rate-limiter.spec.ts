import { LoginRateLimiter } from "./login-rate-limiter";

describe("LoginRateLimiter", () => {
  it("allows five failures and blocks the next attempt for the same email and IP", () => {
    const limiter = new LoginRateLimiter();
    for (let attempt = 0; attempt < 5; attempt++) {
      limiter.assertAllowed("a@example.test", "127.0.0.1", 1);
      limiter.recordFailure("a@example.test", "127.0.0.1", 1);
    }
    expect(() =>
      limiter.assertAllowed("a@example.test", "127.0.0.1", 1),
    ).toThrow();
    expect(() =>
      limiter.assertAllowed("a@example.test", "127.0.0.2", 1),
    ).not.toThrow();
    expect(() =>
      limiter.assertAllowed("a@example.test", "127.0.0.1", 900_002),
    ).not.toThrow();
  });
});
