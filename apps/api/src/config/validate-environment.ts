import { plainToInstance } from "class-transformer";
import { Environment } from "./environment";

export function validateEnvironment(config: Record<string, unknown>) {
  const environment = plainToInstance(Environment, {
    ...config,
    DB_PORT: Number(config.DB_PORT),
  });
  for (const key of [
    "DB_HOST",
    "DB_PORT",
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_DATABASE",
    "DB_DATABASE_TEST",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
  ] as const) {
    if (environment[key] === undefined || environment[key] === "")
      throw new Error(`Missing environment variable ${key}`);
  }
  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
    if (String(config[key]).length < 32)
      throw new Error(`${key} must be at least 32 characters`);
  }
  if (
    config.AUTH_COOKIE_PATH !== undefined &&
    (!String(config.AUTH_COOKIE_PATH).startsWith("/") ||
      /[;\r\n]/.test(String(config.AUTH_COOKIE_PATH)))
  ) {
    throw new Error("AUTH_COOKIE_PATH must be a safe absolute path");
  }
  if (config.BUSINESS_TIMEZONE !== undefined) {
    try {
      new Intl.DateTimeFormat("en", {
        timeZone: String(config.BUSINESS_TIMEZONE),
      });
    } catch {
      throw new Error("BUSINESS_TIMEZONE must be a valid IANA timezone");
    }
  }
  if (
    !Number.isInteger(environment.DB_PORT) ||
    environment.DB_PORT < 1 ||
    environment.DB_PORT > 65535
  ) {
    throw new Error("DB_PORT must be a valid port number");
  }
  return config;
}
