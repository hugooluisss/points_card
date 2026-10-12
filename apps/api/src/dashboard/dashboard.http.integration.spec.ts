import "reflect-metadata";
process.env.NODE_ENV = "test";
import { config } from "dotenv";
config({ path: "apps/api/.env", quiet: true });
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Role } from "@points-card/shared";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { DataSource } from "typeorm";
import { AppModule } from "../app.module";
import { configureApp } from "../configure-app";
import { Clock } from "../ledger/clock";
import { Business } from "../businesses/entities/business.entity";

describe("dashboard HTTP and indexed reads", () => {
  let app: INestApplication;
  let db: DataSource;
  const owners: string[] = [];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    app.get(Clock).now = () => new Date("2026-10-12T18:00:00.000Z");
    db = app.get(DataSource);
    expect(db.options.database).toBe("points_card_test");
    await db.query("SET time_zone = '+00:00'");
    await db.runMigrations();
  });

  afterEach(async () => {
    for (const email of owners.splice(0)) {
      const [row] = await db.query(
        "SELECT business_id FROM staff_users WHERE email=?",
        [email],
      );
      if (row) {
        await db.query("DELETE FROM redemptions WHERE business_id=?", [
          row.business_id,
        ]);
        await db.query(
          "DELETE FROM loyalty_transactions WHERE business_id=? AND reverses_transaction_id IS NOT NULL",
          [row.business_id],
        );
        await db.query("DELETE FROM loyalty_transactions WHERE business_id=?", [
          row.business_id,
        ]);
        await db.query("DELETE FROM audit_logs WHERE business_id=?", [
          row.business_id,
        ]);
        await db.getRepository(Business).delete(row.business_id);
      }
    }
  });

  afterAll(async () => app?.close());

  async function createOwner(label: string) {
    const email = `${label}-${Date.now()}-${Math.random()}@example.test`;
    owners.push(email);
    const password = "secure-password";
    const registered = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({ businessName: label, ownerName: "Owner", email, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    return {
      email,
      password,
      businessId: registered.body.businessId as string,
      branchId: registered.body.branchId as string,
      ownerId: registered.body.ownerId as string,
      auth: { Authorization: `Bearer ${login.body.accessToken}` },
    };
  }

  it("counts Saturday and Sunday operations in consecutive local calendar dates", async () => {
    app.get(Clock).now = () => new Date("2026-10-11T18:00:00.000Z");
    const owner = await createOwner("dashboard-weekend");
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(owner.auth)
      .send({
        name: "Sellos",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 10,
      })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(owner.auth)
      .send({ programId: program.body.id })
      .expect(201);
    const base = [
      owner.businessId,
      owner.branchId,
      account.body.id,
      program.body.id,
      "accumulate",
      1,
      null,
      null,
      null,
      null,
      null,
      owner.ownerId,
    ];
    await db.query(
      `INSERT INTO loyalty_transactions
       (id,business_id,branch_id,account_id,program_id,type,amount,purchase_amount,reward_id,reference,reason,reverses_transaction_id,actor_id,idempotency_key,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?),(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        randomUUID(),
        ...base,
        "weekend-saturday",
        new Date("2026-10-10T18:00:00.000Z"),
        randomUUID(),
        ...base,
        "weekend-sunday",
        new Date("2026-10-11T18:00:00.000Z"),
      ],
    );
    const summary = await request(app.getHttpServer())
      .get("/dashboard/summary?period=7d")
      .set(owner.auth)
      .expect(200);
    expect(summary.body.kpis.operations.value).toBe(2);
    expect(
      summary.body.operationsPerDay.map((row: { date: string }) => row.date),
    ).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(summary.body.operationsPerDay[5].count).toBe(1);
    expect(summary.body.operationsPerDay.at(-1)).toEqual({
      date: "2026-10-11",
      count: 1,
    });
  });

  it("keeps tenant, role, branch and privacy boundaries and paginates 20k indexed movements", async () => {
    app.get(Clock).now = () => new Date("2026-10-12T18:00:00.000Z");
    const first = await createOwner("dashboard-a");
    const second = await createOwner("dashboard-b");
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(first.auth)
      .send({
        name: "Sellos",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 10,
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/programs/${program.body.id}/activate`)
      .set(first.auth)
      .expect(200);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(first.auth)
      .send({ programId: program.body.id })
      .expect(201);
    const customerId = randomUUID();
    await db.query(
      `INSERT INTO customers
      (id,business_id,name,email,phone,status,created_at,updated_at)
      VALUES (?,?,?,?,?,'anonymized','2026-10-12 18:00:00','2026-10-12 18:00:00')`,
      [
        customerId,
        first.businessId,
        "Nombre privado",
        "private@example.test",
        "5551234567",
      ],
    );
    const activeCustomerId = randomUUID();
    await db.query(
      `INSERT INTO customers
      (id,business_id,name,email,phone,status,created_at,updated_at)
      VALUES (?,?,?,?,?,'active','2026-10-12 18:00:00','2026-10-12 18:00:00')`,
      [
        activeCustomerId,
        first.businessId,
        "Ana_100% real",
        "ana@example.test",
        "5550000000",
      ],
    );
    await db.query(
      `INSERT INTO consents
      (id,business_id,customer_id,purpose,channel,notice_version,status,origin,created_at)
      VALUES (?,?,?,?,?,NULL,?,?,?)`,
      [
        randomUUID(),
        first.businessId,
        activeCustomerId,
        "marketing",
        "email",
        "granted",
        "admin",
        "2026-10-12 18:00:00",
      ],
    );
    await db.query(
      `INSERT INTO consents
      (id,business_id,customer_id,purpose,channel,notice_version,status,origin,created_at)
      VALUES (?,?,?,?,?,NULL,?,?,?)`,
      [
        randomUUID(),
        first.businessId,
        activeCustomerId,
        "marketing",
        "email",
        "revoked",
        "admin",
        "2026-10-12 18:01:00",
      ],
    );
    await db.query(
      "UPDATE loyalty_accounts SET customer_id=? WHERE id=? AND business_id=?",
      [customerId, account.body.id, first.businessId],
    );

    const createdAt = new Date("2026-10-12T17:00:00.000Z");
    const rows = Array.from({ length: 20000 }, (_, index) => [
      randomUUID(),
      first.businessId,
      first.branchId,
      account.body.id,
      program.body.id,
      "accumulate",
      1,
      null,
      null,
      null,
      null,
      null,
      first.ownerId,
      `dashboard-seed-${index}`,
      new Date("2026-10-12T17:00:00.000Z"),
    ]);
    for (let offset = 0; offset < rows.length; offset += 400) {
      const batch = rows.slice(offset, offset + 400);
      await db.query(
        `INSERT INTO loyalty_transactions (
          id,business_id,branch_id,account_id,program_id,type,amount,purchase_amount,
          reward_id,reference,reason,reverses_transaction_id,actor_id,idempotency_key,created_at
        ) VALUES ${batch.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").join(",")}`,
        batch.flat(),
      );
    }

    await db.query(
      "UPDATE loyalty_accounts SET balance=20000 WHERE id=? AND business_id=?",
      [account.body.id, first.businessId],
    );
    const reward = await request(app.getHttpServer())
      .post(`/programs/${program.body.id}/rewards`)
      .set(first.auth)
      .send({ name: "Café", cost: 5 })
      .expect(201);
    const transactions = await db.query(
      "SELECT id FROM loyalty_transactions WHERE business_id=? ORDER BY created_at,id LIMIT 1",
      [first.businessId],
    );
    await request(app.getHttpServer())
      .post(`/ledger/${transactions[0].id}/reverse`)
      .set(first.auth)
      .send({
        reason: "Corrección de prueba",
        idempotencyKey: "dashboard-reversal",
      })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/redeem")
      .set(first.auth)
      .send({
        cardCode: account.body.cardCode,
        branchId: first.branchId,
        rewardId: reward.body.id,
        idempotencyKey: "dashboard-redemption",
      })
      .expect(201);

    const page = await request(app.getHttpServer())
      .get("/movements?from=2026-10-12&to=2026-10-12&page=2&pageSize=5")
      .set(first.auth)
      .expect(200);
    expect(page.body).toMatchObject({ total: 20002, page: 2, pageSize: 5 });
    expect(page.body.items).toHaveLength(5);
    expect(page.body.items[0].maskedCard).toBe(
      `••••${account.body.cardCode.slice(-4)}`,
    );
    expect(JSON.stringify(page.body)).not.toContain(account.body.cardCode);
    expect(page.body.items[0].customerName).toBe("Cliente anonimizado");

    const summary = await request(app.getHttpServer())
      .get("/dashboard/summary?period=7d")
      .set(first.auth)
      .expect(200);
    expect(summary.body.kpis.registeredCustomers).toEqual({
      value: 2,
      previous: 0,
    });
    expect(summary.body.kpis.operations).toEqual({ value: 20000, previous: 0 });
    expect(summary.body.kpis.redemptions.value).toBe(1);
    expect(summary.body.operationsPerDay).toHaveLength(7);
    expect(
      summary.body.operationsPerDay.map((row: { date: string }) => row.date),
    ).toEqual([
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
    ]);
    expect(summary.body.operationsPerDay.at(-1).date).toBe("2026-10-12");
    expect(
      summary.body.operationsPerDay.filter(
        (row: { count: number }) => row.count === 0,
      ),
    ).toHaveLength(6);
    expect(summary.body.operationsPerDay[6].count).toBe(20000);
    expect(
      summary.body.operationsPerDay.every((row: { count: number }) =>
        Number.isInteger(row.count),
      ),
    ).toBe(true);
    const metrics = await request(app.getHttpServer())
      .get("/metrics?period=7d")
      .set(first.auth)
      .expect(200);
    expect(metrics.body).toMatchObject({
      registrations: 2,
      activeCustomers: 1,
      repeatVisitRate: 1,
      issuedPasses: 0,
      savedPasses: null,
    });
    expect(metrics.body.redemptionRate).toBe(1);
    const redemptionPage = await request(app.getHttpServer())
      .get("/redemptions?from=2026-10-12&to=2026-10-12&page=1&pageSize=20")
      .set(first.auth)
      .expect(200);
    expect(redemptionPage.body.total).toBe(1);

    const customers = await request(app.getHttpServer())
      .get("/customers?search=Nombre%20privado&page=1&pageSize=20")
      .set(first.auth)
      .expect(200);
    expect(customers.body.total).toBe(0);
    const anonymous = await request(app.getHttpServer())
      .get("/customers?search=5551234567")
      .set(first.auth)
      .expect(200);
    expect(anonymous.body.total).toBe(0);
    const escapedSearch = await request(app.getHttpServer())
      .get("/customers?search=Ana_100%25")
      .set(first.auth)
      .expect(200);
    expect(escapedSearch.body.total).toBe(1);
    expect(escapedSearch.body.items[0].marketingConsent).toBe(false);
    await request(app.getHttpServer())
      .get("/customers?search=%&page=1&pageSize=101")
      .set(first.auth)
      .expect(400);
    await request(app.getHttpServer())
      .get("/customers?page=0&pageSize=20")
      .set(first.auth)
      .expect(400);
    await request(app.getHttpServer())
      .get("/movements?from=2026-10-13&to=2026-10-12")
      .set(first.auth)
      .expect(400)
      .expect(({ body }) =>
        expect(body.message).toBe(
          "La fecha inicial debe ser anterior o igual a la final.",
        ),
      );
    await request(app.getHttpServer())
      .get("/redemptions?from=2025-01-01&to=2026-10-12")
      .set(first.auth)
      .expect(400)
      .expect(({ body }) =>
        expect(body.message).toBe("El rango máximo es de 366 días."),
      );
    await request(app.getHttpServer())
      .get("/movements?from=12-10-2026&to=2026-10-12")
      .set(first.auth)
      .expect(400);
    await request(app.getHttpServer())
      .get(`/customers/${customerId}/detail`)
      .set(first.auth)
      .expect(200)
      .expect(({ body }) => {
        expect(body.customer.name).toBe("Cliente anonimizado");
        expect(body.customer.email).toBeNull();
        expect(body.customer.phone).toBeNull();
        expect(body.customer.marketingConsent).toBe(false);
      });

    const outOfScopeBranch = randomUUID();
    const managerEmail = `dashboard-manager-${Date.now()}@example.test`;
    await request(app.getHttpServer())
      .post("/staff")
      .set(first.auth)
      .send({
        name: "Manager",
        email: managerEmail,
        password: "secure-password",
        role: Role.Manager,
        branchIds: [first.branchId],
      })
      .expect(201);
    const managerLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: managerEmail, password: "secure-password" })
      .expect(200);
    const managerAuth = {
      Authorization: `Bearer ${managerLogin.body.accessToken}`,
    };
    await request(app.getHttpServer())
      .get(`/dashboard/summary?period=7d&branchId=${outOfScopeBranch}`)
      .set(managerAuth)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/metrics?period=7d&branchId=${outOfScopeBranch}`)
      .set(managerAuth)
      .expect(403);
    await request(app.getHttpServer())
      .get(
        `/movements?from=2026-10-12&to=2026-10-12&branchId=${outOfScopeBranch}`,
      )
      .set(managerAuth)
      .expect(403);
    await request(app.getHttpServer())
      .get(
        `/redemptions?from=2026-10-12&to=2026-10-12&branchId=${outOfScopeBranch}`,
      )
      .set(managerAuth)
      .expect(403);
    await request(app.getHttpServer())
      .get("/dashboard/summary?period=7d")
      .set(managerAuth)
      .expect(200);
    await request(app.getHttpServer())
      .get("/customers")
      .set(second.auth)
      .expect(200)
      .expect(({ body }) => expect(body.total).toBe(0));
    await request(app.getHttpServer())
      .get("/dashboard/summary?period=7d")
      .set(second.auth)
      .expect(200)
      .expect(({ body }) => expect(body.kpis.operations.value).toBe(0));
    await request(app.getHttpServer())
      .get("/metrics?period=7d")
      .set(second.auth)
      .expect(200)
      .expect(({ body }) => expect(body.activeCustomers).toBe(0));
    await request(app.getHttpServer())
      .get("/movements?from=2026-10-11&to=2026-10-11")
      .set(second.auth)
      .expect(200)
      .expect(({ body }) => expect(body.total).toBe(0));
    await request(app.getHttpServer())
      .get("/redemptions?from=2026-10-11&to=2026-10-11")
      .set(second.auth)
      .expect(200)
      .expect(({ body }) => expect(body.total).toBe(0));
    await request(app.getHttpServer())
      .get("/branches")
      .set(second.auth)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await request(app.getHttpServer())
      .get("/staff/options")
      .set(second.auth)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    const otherCustomerCsv = await request(app.getHttpServer())
      .get("/exports/customers.csv")
      .set(second.auth)
      .expect(200);
    expect(otherCustomerCsv.text).not.toContain("ana@example.test");
    const otherMovementCsv = await request(app.getHttpServer())
      .get("/exports/movements.csv?from=2026-10-12&to=2026-10-12")
      .set(second.auth)
      .expect(200);
    expect(otherMovementCsv.text.split("\r\n")).toHaveLength(2);
    await request(app.getHttpServer())
      .get(`/customers/${customerId}/detail`)
      .set(second.auth)
      .expect(404);

    const cashierEmail = `dashboard-cashier-${Date.now()}@example.test`;
    await request(app.getHttpServer())
      .post("/staff")
      .set(first.auth)
      .send({
        name: "Cashier",
        email: cashierEmail,
        password: "secure-password",
        role: Role.Cashier,
        branchIds: [first.branchId],
      })
      .expect(201);
    const cashierLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: cashierEmail, password: "secure-password" })
      .expect(200);
    const cashierAuth = {
      Authorization: `Bearer ${cashierLogin.body.accessToken}`,
    };
    await request(app.getHttpServer())
      .get("/dashboard/summary?period=7d")
      .set(cashierAuth)
      .expect(200);
    await request(app.getHttpServer())
      .get("/customers")
      .set(cashierAuth)
      .expect(200);
    await request(app.getHttpServer())
      .get("/movements?from=2026-10-12&to=2026-10-12")
      .set(cashierAuth)
      .expect(200);
    await request(app.getHttpServer())
      .get("/redemptions?from=2026-10-12&to=2026-10-12")
      .set(cashierAuth)
      .expect(200);
    await request(app.getHttpServer())
      .get("/branches")
      .set(cashierAuth)
      .expect(200);
    await request(app.getHttpServer())
      .get("/metrics?period=7d")
      .set(cashierAuth)
      .expect(403);
    await request(app.getHttpServer())
      .get("/exports/customers.csv")
      .set(cashierAuth)
      .expect(403);
    const csv = await request(app.getHttpServer())
      .get("/exports/customers.csv")
      .set(first.auth)
      .expect(200);
    expect(csv.headers["content-disposition"]).toContain("clientes.csv");
    expect(csv.text.charCodeAt(0)).toBe(0xfeff);
    expect(csv.text).not.toContain("private@example.test");
    const audit = await db.query(
      "SELECT action FROM audit_logs WHERE business_id=? AND action='dashboard.export_customers'",
      [first.businessId],
    );
    expect(audit).toHaveLength(1);

    const explain = await db.query(
      `EXPLAIN SELECT id FROM loyalty_transactions
      WHERE business_id=? AND created_at>=? AND created_at<?
      ORDER BY created_at DESC,id DESC LIMIT 20`,
      [first.businessId, createdAt, new Date("2026-10-13T00:00:00Z")],
    );
    expect([
      "ix_transactions_business_created",
      "ix_transactions_business_branch_created",
      "ix_transactions_business_account_created",
    ]).toContain(explain[0].key);
    const summaryExplain = await db.query(
      `EXPLAIN SELECT COUNT(*) FROM loyalty_transactions
      WHERE business_id=? AND created_at>=? AND created_at<?
        AND type IN ('accumulate','redeem','adjust')`,
      [first.businessId, createdAt, new Date("2026-10-13T00:00:00Z")],
    );
    expect(summaryExplain[0].key).toBeTruthy();
  }, 30000);
});
