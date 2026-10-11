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
