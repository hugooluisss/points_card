import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { databaseOptions } from "./database.options";
import { ConfigService } from "@nestjs/config";

config();

describe("database migrations", () => {
  it("runs and reverts against DB_DATABASE_TEST", async () => {
    const dataSource = new DataSource(
      databaseOptions(new ConfigService({ ...process.env, NODE_ENV: "test" })),
    );
    await dataSource.initialize();
    try {
      const authApplied = await dataSource.query(
        "SELECT name FROM migrations WHERE name = 'CreateAuthAndAudit1760000002000'",
      );
      if (authApplied.length) await dataSource.undoLastMigration();
      const staffApplied = await dataSource.query(
        "SELECT name FROM migrations WHERE name = 'CreateStaffUsers1760000001000'",
      );
      if (staffApplied.length) await dataSource.undoLastMigration();
      const applied = await dataSource.query(
        "SELECT name FROM migrations WHERE name = 'CreateBusinessesAndBranches1760000000000'",
      );
      if (applied.length) await dataSource.undoLastMigration();
      await dataSource.runMigrations();
      expect(
        await dataSource.query("SHOW TABLES LIKE 'businesses'"),
      ).toHaveLength(1);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'branches'"),
      ).toHaveLength(1);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'staff_users'"),
      ).toHaveLength(1);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'refresh_tokens'"),
      ).toHaveLength(1);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'audit_logs'"),
      ).toHaveLength(1);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'programs'"),
      ).toHaveLength(1);
      expect(await dataSource.query("SHOW TABLES LIKE 'rewards'")).toHaveLength(
        1,
      );
      await dataSource.undoLastMigration();
      expect(
        await dataSource.query("SHOW TABLES LIKE 'programs'"),
      ).toHaveLength(0);
      expect(await dataSource.query("SHOW TABLES LIKE 'rewards'")).toHaveLength(
        0,
      );
      expect(
        await dataSource.query("SHOW TABLES LIKE 'refresh_tokens'"),
      ).toHaveLength(1);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'audit_logs'"),
      ).toHaveLength(1);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'staff_users'"),
      ).toHaveLength(1);
      await dataSource.undoLastMigration();
      expect(
        await dataSource.query("SHOW TABLES LIKE 'refresh_tokens'"),
      ).toHaveLength(0);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'audit_logs'"),
      ).toHaveLength(0);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'staff_users'"),
      ).toHaveLength(1);
      await dataSource.undoLastMigration();
      expect(
        await dataSource.query("SHOW TABLES LIKE 'staff_users'"),
      ).toHaveLength(0);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'branches'"),
      ).toHaveLength(1);
      await dataSource.undoLastMigration();
      expect(
        await dataSource.query("SHOW TABLES LIKE 'branches'"),
      ).toHaveLength(0);
      expect(
        await dataSource.query("SHOW TABLES LIKE 'businesses'"),
      ).toHaveLength(0);
    } finally {
      const applied = await dataSource.query(
        "SELECT name FROM migrations WHERE name = 'CreateBusinessesAndBranches1760000000000'",
      );
      const staffApplied = await dataSource.query(
        "SELECT name FROM migrations WHERE name = 'CreateStaffUsers1760000001000'",
      );
      const authApplied = await dataSource.query(
        "SELECT name FROM migrations WHERE name = 'CreateAuthAndAudit1760000002000'",
      );
      if (
        applied.length ||
        staffApplied.length ||
        authApplied.length
      ) {
        if (authApplied.length) await dataSource.undoLastMigration();
        if (staffApplied.length) await dataSource.undoLastMigration();
        if (applied.length) await dataSource.undoLastMigration();
      }
      await dataSource.destroy();
    }
  });
});
