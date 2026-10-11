import "reflect-metadata";
process.env.NODE_ENV = "test";
import { config } from "dotenv";
config({ path: "apps/api/.env", quiet: true });
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { AppModule } from "../app.module";
import { configureApp } from "../configure-app";
import { databaseOptions } from "../database/database.options";
import { Business } from "../businesses/entities/business.entity";
import { Clock } from "./clock";
import { Branch } from "../branches/entities/branch.entity";

describe("ledger HTTP", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let fixedNow: Date;
  const emails: string[] = [];
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    fixedNow = new Date("2026-10-12T05:59:00.000Z");
    app.get(Clock).now = () => new Date(fixedNow);
    dataSource = new DataSource(
      databaseOptions(new ConfigService({ ...process.env, NODE_ENV: "test" })),
    );
    await dataSource.initialize();
    await dataSource.query("SET time_zone = '+00:00'");
    expect(dataSource.options.database).toBe("points_card_test");
    expect(app.get(DataSource).options.database).toBe("points_card_test");
    if (
      !(
        await dataSource.query(
          "SELECT name FROM migrations WHERE name = 'CreateWalletSyncJobs1760000006000'",
        )
      ).length
    )
      await dataSource.runMigrations();
    const roundTrip = new Date("2026-10-11T23:59:00.000Z");
    await dataSource.query(
      "CREATE TEMPORARY TABLE utc_timestamp_probe (value TIMESTAMP NOT NULL)",
    );
    await dataSource.query("INSERT INTO utc_timestamp_probe VALUES (?)", [
      roundTrip,
    ]);
    const [stored] = await dataSource.query(
      "SELECT value FROM utc_timestamp_probe",
    );
    expect(new Date(stored.value).toISOString()).toBe(roundTrip.toISOString());
    await dataSource.query("DROP TEMPORARY TABLE utc_timestamp_probe");
  });
  afterEach(async () => {
    for (const email of emails.splice(0)) {
      const rows = await dataSource.query(
        "SELECT business_id FROM staff_users WHERE email = ?",
        [email],
      );
      for (const row of rows) {
        await dataSource.query(
          "DELETE r FROM redemptions r JOIN loyalty_accounts a ON r.account_id = a.id WHERE a.business_id = ?",
          [row.business_id],
        );
        await dataSource.query(
          "DELETE FROM loyalty_transactions WHERE business_id = ? AND reverses_transaction_id IS NOT NULL",
          [row.business_id],
        );
        await dataSource.query(
          "DELETE FROM loyalty_transactions WHERE business_id = ?",
          [row.business_id],
        );
        await dataSource.query(
          "DELETE FROM loyalty_accounts WHERE business_id = ?",
          [row.business_id],
        );
        await dataSource.query("DELETE FROM audit_logs WHERE business_id = ?", [
          row.business_id,
        ]);
        await dataSource.getRepository(Business).delete(row.business_id);
      }
    }
  });
  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it("is idempotent, serializes competing redemptions, reverses immutably, and keeps balance equal to ledger sum", async () => {
    const email = `ledger-${Date.now()}-${Math.random()}@example.test`;
    emails.push(email);
    const password = "secure-password";
    const registered = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({ businessName: "Ledger", ownerName: "Owner", email, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };
    const emailB = `ledger-other-${Date.now()}-${Math.random()}@example.test`;
    emails.push(emailB);
    const businessB = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "Other",
        ownerName: "Other",
        email: emailB,
        password,
      })
      .expect(201);
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(auth)
      .send({
        name: "Sellos",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 5,
      })
      .expect(201);
    const reward = await request(app.getHttpServer())
      .post(`/programs/${program.body.id}/rewards`)
      .set(auth)
      .send({ name: "Premio", cost: 1 })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(auth)
      .send({ programId: program.body.id })
      .expect(201);
    const branchId = registered.body.branchId;
    for (const path of ["/ledger/accumulate", "/ledger/redeem"]) {
      const payload = path.endsWith("accumulate")
        ? {
            cardCode: account.body.cardCode,
            branchId: businessB.body.branchId,
            idempotencyKey: `foreign-${path}`,
          }
        : {
            cardCode: account.body.cardCode,
            branchId: businessB.body.branchId,
            rewardId: reward.body.id,
            idempotencyKey: `foreign-${path}`,
          };
      await request(app.getHttpServer())
        .post(path)
        .set(auth)
        .send(payload)
        .expect(404);
    }
    await request(app.getHttpServer())
      .post("/ledger/adjust")
      .set(auth)
      .send({
        cardCode: account.body.cardCode,
        amount: 1,
        reason: "prueba",
        idempotencyKey: "foreign-adjust",
        branchId: businessB.body.branchId,
      })
      .expect(404);
    const first = {
      cardCode: account.body.cardCode,
      branchId,
      idempotencyKey: "same-accumulation",
    };
    const accumulated = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send(first)
      .expect(201);
    const repeated = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send(first)
      .expect(201);
    expect(repeated.body.transaction.id).toBe(accumulated.body.transaction.id);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({ ...first, purchaseAmount: 99 })
      .expect(409)
      .expect((response) =>
        expect(response.body.message).toBe(
          "La clave de idempotencia ya se usó con otra operación.",
        ),
      );
    const concurrentRetry = await Promise.all([
      request(app.getHttpServer())
        .post("/ledger/accumulate")
        .set(auth)
        .send({ ...first, idempotencyKey: "concurrent-same" }),
      request(app.getHttpServer())
        .post("/ledger/accumulate")
        .set(auth)
        .send({ ...first, idempotencyKey: "concurrent-same" }),
    ]);
    expect(concurrentRetry.map((response) => response.status)).toEqual([
      201, 201,
    ]);
    expect(concurrentRetry[0].body.transaction.id).toBe(
      concurrentRetry[1].body.transaction.id,
    );
    const raceAccount = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(auth)
      .send({ programId: program.body.id })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({
        cardCode: raceAccount.body.cardCode,
        branchId,
        idempotencyKey: "race-seed",
      })
      .expect(201);
    const race = await Promise.all([
      request(app.getHttpServer())
        .post("/ledger/redeem")
        .set(auth)
        .send({
          cardCode: raceAccount.body.cardCode,
          branchId,
          rewardId: reward.body.id,
          idempotencyKey: "redeem-a",
        }),
      request(app.getHttpServer())
        .post("/ledger/redeem")
        .set(auth)
        .send({
          cardCode: raceAccount.body.cardCode,
          branchId,
          rewardId: reward.body.id,
          idempotencyKey: "redeem-b",
        }),
    ]);
    expect(race.filter((response) => response.status === 201)).toHaveLength(1);
    expect(race.filter((response) => response.status === 409)).toHaveLength(1);
    const redeemed = race.find((response) => response.status === 201)!;
    const original = await dataSource.query(
      "SELECT id, amount FROM loyalty_transactions WHERE id = ?",
      [redeemed.body.transaction.id],
    );
    await request(app.getHttpServer())
      .post(`/ledger/${redeemed.body.transaction.id}/reverse`)
      .set(auth)
      .send({ reason: "Error de prueba", idempotencyKey: "reverse-a" })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/ledger/${redeemed.body.transaction.id}/reverse`)
      .set(auth)
      .send({ reason: "Otra vez", idempotencyKey: "reverse-b" })
      .expect(409);
    const reversal = await dataSource.query(
      "SELECT id FROM loyalty_transactions WHERE reverses_transaction_id = ?",
      [redeemed.body.transaction.id],
    );
    await request(app.getHttpServer())
      .post(`/ledger/${reversal[0].id}/reverse`)
      .set(auth)
      .send({ reason: "Revertir reverso", idempotencyKey: "reverse-c" })
      .expect(409);
    const after = await dataSource.query(
      "SELECT id, amount FROM loyalty_transactions WHERE id = ?",
      [redeemed.body.transaction.id],
    );
    expect(after).toEqual(original);
    const totals = await dataSource.query(
      "SELECT a.balance, COALESCE(SUM(t.amount), 0) AS ledger_balance FROM loyalty_accounts a LEFT JOIN loyalty_transactions t ON t.account_id = a.id WHERE a.id = ? GROUP BY a.id",
      [raceAccount.body.id],
    );
    expect(Number(totals[0].balance)).toBe(Number(totals[0].ledger_balance));
    await request(app.getHttpServer())
      .get(`/cards/${account.body.cardCode}`)
      .set(auth)
      .expect(200)
      .expect((response) => {
        expect(response.body.progress).toBe(2);
        expect(response.body.rewardAvailable).toBe(true);
      });
    const keyCount = await dataSource.query(
      "SELECT COUNT(*) AS count FROM loyalty_transactions WHERE business_id = ? AND idempotency_key = 'concurrent-same'",
      [registered.body.businessId],
    );
    expect(Number(keyCount[0].count)).toBe(1);
  });

  it("enforces fraud limits, persists references, requires reversal reasons, and exposes tenant anomalies", async () => {
    process.env.BUSINESS_TIMEZONE = "America/Mexico_City";
    const email = `fraud-${Date.now()}-${Math.random()}@example.test`;
    emails.push(email);
    const password = "secure-password";
    const business = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({ businessName: "Fraud", ownerName: "Owner", email, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(auth)
      .send({
        name: "Stamps",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 10,
        minIntervalMinutes: 60,
        maxAccumulationsPerCardPerDay: 2,
        maxAccumulationsPerStaffPerDay: 20,
        staffDailyAlertThreshold: 1,
      })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(auth)
      .send({ programId: program.body.id })
      .expect(201);
    const branchId = business.body.branchId;
    await request(app.getHttpServer())
      .post("/staff")
      .set(auth)
      .send({
        name: "Threshold cashier",
        email: `limit-${Date.now()}@example.test`,
        password,
        role: "cashier",
      })
      .expect(201);
    const first = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({
        cardCode: account.body.cardCode,
        branchId,
        idempotencyKey: "fraud-first",
        reference: "ticket-42",
      })
      .expect(201);
    expect(first.body.transaction.reference).toBe("ticket-42");
    await dataSource.query(
      "UPDATE loyalty_transactions SET created_at = ? WHERE id = ?",
      [fixedNow, first.body.transaction.id],
    );
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({
        cardCode: account.body.cardCode,
        branchId,
        idempotencyKey: "fraud-fast",
      })
      .expect(409)
      .expect(({ body }) =>
        expect(body.message).toMatch(/Demasiado pronto: espera \d+ min/),
      );
    await dataSource.query(
      "UPDATE programs SET min_interval_minutes = NULL WHERE id = ?",
      [program.body.id],
    );
    await dataSource.query(
      "UPDATE loyalty_transactions SET created_at = ? WHERE id = ?",
      [new Date("2026-10-12T05:59:00.000Z"), first.body.transaction.id],
    );
    const second = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({
        cardCode: account.body.cardCode,
        branchId,
        idempotencyKey: "fraud-second",
      })
      .expect(201);
    await dataSource.query(
      "UPDATE programs SET min_interval_minutes = NULL WHERE id = ?",
      [program.body.id],
    );
    const reversed = await request(app.getHttpServer())
      .post(`/ledger/${first.body.transaction.id}/reverse`)
      .set(auth)
      .send({ reason: "Duplicate", idempotencyKey: "fraud-reversed" })
      .expect(201);
    await dataSource.query(
      "UPDATE loyalty_transactions SET created_at = ? WHERE id = ?",
      [new Date("2026-10-12T05:59:00.000Z"), second.body.transaction.id],
    );
    await dataSource.query(
      "UPDATE loyalty_transactions SET created_at = ? WHERE account_id = ? AND idempotency_key = 'fraud-first'",
      [new Date("2026-10-12T05:59:00.000Z"), account.body.id],
    );
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({
        cardCode: account.body.cardCode,
        branchId,
        idempotencyKey: "fraud-limit",
      })
      .expect(409)
      .expect(({ body }) =>
        expect(body.message).toContain("límite de acumulaciones"),
      );
    fixedNow = new Date("2026-10-12T06:01:00.000Z");
    const third = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({
        cardCode: account.body.cardCode,
        branchId,
        idempotencyKey: "fraud-after-midnight",
      })
      .expect(201);
    await dataSource.query(
      "UPDATE loyalty_transactions SET created_at = ? WHERE idempotency_key IN ('fraud-second', 'fraud-after-midnight')",
      [new Date("2026-10-12T06:01:00.000Z")],
    );
    await dataSource.query(
      "UPDATE loyalty_transactions SET created_at = ? WHERE id = ?",
      [new Date("2026-10-12T06:01:00.000Z"), third.body.transaction.id],
    );
    await request(app.getHttpServer())
      .post(`/ledger/${reversed.body.transaction.id}/reverse`)
      .set(auth)
      .send({ reason: "  ", idempotencyKey: "fraud-reverse-short" })
      .expect(400);
    const anomalies = await request(app.getHttpServer())
      .get("/ledger/anomalies?date=2026-10-12")
      .set(auth)
      .expect(200);
    expect(anomalies.body).toHaveLength(1);
    expect(Number(anomalies.body[0].count)).toBe(2);
    const previousDay = await request(app.getHttpServer())
      .get("/ledger/anomalies?date=2026-10-11")
      .set(auth)
      .expect(200);
    expect(previousDay.body).toHaveLength(0);
  });

  it("resolves optional branches to the business default or the staff user's first allowed branch", async () => {
    const email = `optional-branch-${Date.now()}@example.test`;
    emails.push(email);
    const password = "secure-password";
    const business = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({ businessName: "Branches", ownerName: "Owner", email, password })
      .expect(201);
    const owner = {
      Authorization: `Bearer ${(await request(app.getHttpServer()).post("/auth/login").send({ email, password }).expect(200)).body.accessToken}`,
    };
    const extra = await dataSource
      .getRepository(Branch)
      .save({
        businessId: business.body.businessId,
        name: "Second",
        isDefault: false,
      });
    const denied = await dataSource
      .getRepository(Branch)
      .save({
        businessId: business.body.businessId,
        name: "Third",
        isDefault: false,
      });
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(owner)
      .send({
        name: "Stamps",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 5,
      })
      .expect(201);
    const reward = await request(app.getHttpServer())
      .post(`/programs/${program.body.id}/rewards`)
      .set(owner)
      .send({ name: "Treat", cost: 1 })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(owner)
      .send({ programId: program.body.id })
      .expect(201);
    const defaulted = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(owner)
      .send({
        cardCode: account.body.cardCode,
        idempotencyKey: "branch-default",
      })
      .expect(201);
    expect(defaulted.body.transaction.branchId).toBe(business.body.branchId);
    const cashierEmail = `optional-branch-cashier-${Date.now()}@example.test`;
    emails.push(cashierEmail);
    await request(app.getHttpServer())
      .post("/staff")
      .set(owner)
      .send({
        name: "Cashier",
        email: cashierEmail,
        password,
        role: "cashier",
        branchIds: [extra.id, business.body.branchId],
      })
      .expect(201);
    const cashier = {
      Authorization: `Bearer ${(await request(app.getHttpServer()).post("/auth/login").send({ email: cashierEmail, password }).expect(200)).body.accessToken}`,
    };
    const firstAllowed = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(cashier)
      .send({
        cardCode: account.body.cardCode,
        idempotencyKey: "branch-first-allowed",
      })
      .expect(201);
    expect(firstAllowed.body.transaction.branchId).toBe(extra.id);
    const supplied = await request(app.getHttpServer())
      .post("/ledger/redeem")
      .set(cashier)
      .send({
        cardCode: account.body.cardCode,
        branchId: business.body.branchId,
        rewardId: reward.body.id,
        idempotencyKey: "branch-supplied-allowed",
      })
      .expect(201);
    expect(supplied.body.transaction.branchId).toBe(business.body.branchId);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(cashier)
      .send({
        cardCode: account.body.cardCode,
        branchId: denied.id,
        idempotencyKey: "branch-denied",
      })
      .expect(403);
    const redeemedDefault = await request(app.getHttpServer())
      .post("/ledger/redeem")
      .set(cashier)
      .send({
        cardCode: account.body.cardCode,
        rewardId: reward.body.id,
        idempotencyKey: "branch-redeem-default",
      })
      .expect(201);
    expect(redeemedDefault.body.transaction.branchId).toBe(extra.id);
  });
});
