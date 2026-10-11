import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { HealthController } from "./health.controller";
import { databaseOptions } from "./database/database.options";
import { TenancyModule } from "./tenancy/tenancy.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { AuthModule } from "./auth/auth.module";
import { StaffModule } from "./staff/staff.module";
import { AuditModule } from "./audit/audit.module";

class Environment {
  DB_HOST!: string;
  DB_PORT!: number;
  DB_USERNAME!: string;
  DB_PASSWORD!: string;
  DB_DATABASE!: string;
  DB_DATABASE_TEST!: string;
  JWT_ACCESS_SECRET!: string;
  JWT_REFRESH_SECRET!: string;
  AUTH_COOKIE_PATH?: string;
}

function validateEnvironment(config: Record<string, unknown>) {
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
  if (
    !Number.isInteger(environment.DB_PORT) ||
    environment.DB_PORT < 1 ||
    environment.DB_PORT > 65535
  ) {
    throw new Error("DB_PORT must be a valid port number");
  }
  return config;
}

@Module({
  imports: [
    BusinessesModule,
    TenancyModule,
    AuthModule,
    StaffModule,
    AuditModule,
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => databaseOptions(config),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
