import { CreateBilling1760000009000 } from "./migrations/1760000009000-CreateBilling";

describe("CreateBilling migration", () => {
  it("seeds the two editable plans and backfills all existing businesses", async () => {
    const queries: string[] = [];
    const runner = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql);
      }),
    };
    await new CreateBilling1760000009000().up(runner as never);
    const planSeed = queries.find((sql) => sql.includes("INSERT INTO plans"))!;
    expect(planSeed).toContain("'Básico',149.00,'MXN',1,3,500");
    expect(planSeed).toContain("'Negocio',299.00,'MXN',5,15,5000");
    const backfill = queries.find((sql) =>
      sql.includes("INSERT INTO subscriptions"),
    )!;
    expect(backfill).toContain("SELECT id");
    expect(backfill).toContain("FROM businesses");
    expect(backfill).toContain("INTERVAL 14 DAY");
  });
});
