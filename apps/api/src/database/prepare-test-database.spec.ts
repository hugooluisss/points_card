import { prepareTestDatabase } from "./prepare-test-database";

describe("prepareTestDatabase safety", () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    process.env.DB_DATABASE = "points_card";
    process.env.DB_DATABASE_TEST = "points_card_test";
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnvironment)) delete process.env[key];
    }
    Object.assign(process.env, originalEnvironment);
  });

  it("refuses a configured database without the _test suffix", async () => {
    process.env.DB_DATABASE_TEST = "points_card";
    const createDataSource = jest.fn();

    await expect(prepareTestDatabase(createDataSource)).rejects.toThrow(
      "Refusing to reset a database not explicitly named as a test database.",
    );
    expect(createDataSource).not.toHaveBeenCalled();
  });

  it("targets DB_DATABASE_TEST when NODE_ENV is unset", async () => {
    const databaseOptions: { database?: string }[] = [];
    const dataSource = {
      initialize: jest.fn(async () => dataSource),
      query: jest.fn(async () => [{ selected_database: "points_card_test" }]),
      dropDatabase: jest.fn(async () => undefined),
      runMigrations: jest.fn(async () => []),
      destroy: jest.fn(async () => undefined),
    };

    await prepareTestDatabase((options) => {
      databaseOptions.push(options as { database?: string });
      return dataSource;
    });

    expect(databaseOptions[0].database).toBe("points_card_test");
    expect(dataSource.dropDatabase).toHaveBeenCalledTimes(1);
  });

  it("destroys the connection without dropping when MySQL selects another database", async () => {
    const dataSource = {
      initialize: jest.fn(async () => dataSource),
      query: jest.fn(async () => [{ selected_database: "points_card" }]),
      dropDatabase: jest.fn(async () => undefined),
      runMigrations: jest.fn(async () => []),
      destroy: jest.fn(async () => undefined),
    };

    await expect(prepareTestDatabase(() => dataSource)).rejects.toThrow(
      "Refusing to reset a database not explicitly named as a test database.",
    );
    expect(dataSource.dropDatabase).not.toHaveBeenCalled();
    expect(dataSource.destroy).toHaveBeenCalledTimes(1);
  });
});
