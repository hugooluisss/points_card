import { ConfigService } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { databaseOptions } from "./database.options";

type TestDataSource = Pick<
  DataSource,
  "initialize" | "query" | "dropDatabase" | "runMigrations" | "destroy"
>;

type TestDataSourceFactory = (options: DataSourceOptions) => TestDataSource;

export async function prepareTestDatabase(
  createDataSource: TestDataSourceFactory = (options) =>
    new DataSource(options),
) {
  const config = new ConfigService(process.env);
  const testDatabase = config.getOrThrow<string>("DB_DATABASE_TEST");
  const applicationDatabase = config.getOrThrow<string>("DB_DATABASE");
  if (!testDatabase.endsWith("_test") || testDatabase === applicationDatabase) {
    throw new Error(
      "Refusing to reset a database not explicitly named as a test database.",
    );
  }

  const dataSource = createDataSource(databaseOptions(config, testDatabase));
  await dataSource.initialize();
  try {
    const [{ selected_database }] = await dataSource.query(
      "SELECT DATABASE() AS selected_database",
    );
    if (
      selected_database !== testDatabase ||
      !selected_database.endsWith("_test") ||
      selected_database === applicationDatabase
    ) {
      throw new Error(
        "Refusing to reset a database not explicitly named as a test database.",
      );
    }
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}
