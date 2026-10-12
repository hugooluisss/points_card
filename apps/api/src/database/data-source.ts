import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { databaseOptions } from "./database.options";
import { ConfigService } from "@nestjs/config";

config();

const configService = new ConfigService(process.env);
const database = configService.getOrThrow<string>(
  process.env.NODE_ENV === "test" ? "DB_DATABASE_TEST" : "DB_DATABASE",
);

export default new DataSource(databaseOptions(configService, database));
