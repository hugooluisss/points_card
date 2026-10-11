import { ConfigService } from "@nestjs/config";
import { join } from "node:path";
import { DataSourceOptions } from "typeorm";
import { Branch } from "../branches/entities/branch.entity";
import { Business } from "../businesses/entities/business.entity";
import { StaffUser } from "../staff/entities/staff-user.entity";
import { RefreshToken } from "../auth/entities/refresh-token.entity";
import { AuditLog } from "../audit/entities/audit-log.entity";

export function databaseOptions(config: ConfigService): DataSourceOptions {
  return {
    type: "mysql",
    host: config.getOrThrow<string>("DB_HOST"),
    port: config.getOrThrow<number>("DB_PORT"),
    username: config.getOrThrow<string>("DB_USERNAME"),
    password: config.getOrThrow<string>("DB_PASSWORD"),
    database: config.getOrThrow<string>(
      process.env.NODE_ENV === "test" ? "DB_DATABASE_TEST" : "DB_DATABASE",
    ),
    entities: [
      Business,
      Branch,
      StaffUser,
      RefreshToken,
      AuditLog,
    ],
    migrations: [join(__dirname, "migrations", "*{.ts,.js}")],
    synchronize: false,
  };
}
