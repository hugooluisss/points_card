import { validateEnvironment } from "./validate-environment";

const validConfig = {
  DB_HOST: "localhost",
  DB_PORT: "3306",
  DB_USERNAME: "user",
  DB_PASSWORD: "password",
  DB_DATABASE: "app",
  DB_DATABASE_TEST: "app_test",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
};

describe("validateEnvironment", () => {
  it("returns valid config and rejects unsafe values", () => {
    expect(validateEnvironment(validConfig)).toBe(validConfig);
    expect(() =>
      validateEnvironment({ ...validConfig, WALLET_PASS_PROVIDER: "google" }),
    ).toThrow("Missing environment variable GOOGLE_WALLET_ISSUER_ID");
    expect(
      validateEnvironment({
        ...validConfig,
        WALLET_PASS_PROVIDER: "google",
        GOOGLE_WALLET_ISSUER_ID: "issuer",
        GOOGLE_WALLET_KEY_PATH: "/key.json",
      }),
    ).toMatchObject({ WALLET_PASS_PROVIDER: "google" });
    expect(() => validateEnvironment({ ...validConfig, DB_PORT: "0" })).toThrow(
      "DB_PORT must be a valid port number",
    );
    expect(() =>
      validateEnvironment({ ...validConfig, AUTH_COOKIE_PATH: "/x; Secure" }),
    ).toThrow("AUTH_COOKIE_PATH must be a safe absolute path");
    expect(() =>
      validateEnvironment({
        ...validConfig,
        BUSINESS_TIMEZONE: "Mars/Olympus",
      }),
    ).toThrow("BUSINESS_TIMEZONE must be a valid IANA timezone");
  });
});
