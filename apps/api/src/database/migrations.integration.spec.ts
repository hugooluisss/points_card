import "reflect-metadata";
import { config } from "dotenv";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { databaseOptions } from "./database.options";
import { prepareTestDatabase } from "./prepare-test-database";

config();

describe("database migrations", () => {
  it("reverts and applies every migration, then leaves the test database migrated", async () => {
    config({ path: ".env", quiet: true });
    const nodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    try {
      await prepareTestDatabase();
    } finally {
      if (nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
    }
    const dataSource = new DataSource(
      databaseOptions(
        new ConfigService({ ...process.env, NODE_ENV: "test" }),
        process.env.DB_DATABASE_TEST!,
      ),
    );
    const assertCleanSchema = async () => {
      const tables: Record<string, string>[] =
        await dataSource.query("SHOW TABLES");
      expect(tables.map((row) => Object.values(row)[0]).sort()).toEqual([
        "migrations",
      ]);
    };
    const revertAll = async () => {
      while (
        Number(
          (
            await dataSource.query("SELECT COUNT(*) AS count FROM migrations")
          )[0].count,
        ) > 0
      ) {
        await dataSource.undoLastMigration();
      }
    };
    try {
      await dataSource.initialize();
      expect(
        await dataSource.query("SELECT DATABASE() AS selected_database"),
      ).toEqual([{ selected_database: process.env.DB_DATABASE_TEST }]);
      const migrationCount = dataSource.migrations.length;
      expect(
        Number(
          (
            await dataSource.query("SELECT COUNT(*) AS count FROM migrations")
          )[0].count,
        ),
      ).toBe(migrationCount);

      await revertAll();
      await assertCleanSchema();
      const applied = await dataSource.runMigrations();
      expect(applied).toHaveLength(migrationCount);

      for (const table of [
        "businesses",
        "branches",
        "staff_users",
        "refresh_tokens",
        "audit_logs",
        "programs",
        "rewards",
        "loyalty_accounts",
        "loyalty_transactions",
        "redemptions",
        "customers",
        "privacy_notices",
        "consents",
        "wallet_passes",
        "card_recovery_tokens",
      ]) {
        expect(
          await dataSource.query(`SHOW TABLES LIKE '${table}'`),
        ).toHaveLength(1);
      }

      await revertAll();
      await assertCleanSchema();
    } finally {
      try {
        if (dataSource.isInitialized) {
          await dataSource.destroy();
        }
      } finally {
        await prepareTestDatabase();
      }
    }
  }, 120_000);
});
