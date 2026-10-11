import "reflect-metadata";
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
import { WalletSyncRepository } from "./wallet-sync.repository";
import { TenantContext } from "../tenancy/tenant-context.service";
import { WalletSyncWorker } from "./wallet-sync.worker";
import { WALLET_PROVIDER } from "./wallet-provider";

describe("wallet sync", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const emails: string[] = [];
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = new DataSource(
      databaseOptions(new ConfigService({ ...process.env, NODE_ENV: "test" })),
    );
    await dataSource.initialize();
    await dataSource.runMigrations();
  });
  afterEach(async () => {
    for (const email of emails.splice(0)) {
      const rows = await dataSource.query(
        "SELECT business_id FROM staff_users WHERE email = ?",
        [email],
      );
      for (const row of rows) {
        await dataSource.query(
          "DELETE FROM wallet_sync_jobs WHERE business_id = ?",
          [row.business_id],
        );
        await dataSource.query(
          "DELETE r FROM redemptions r JOIN loyalty_accounts a ON r.account_id = a.id WHERE a.business_id = ?",
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

  it("rolls enqueue back with its transaction", async () => {
    const email = `wallet-rollback-${Date.now()}@example.test`;
    emails.push(email);
    const reg = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "Rollback",
        ownerName: "Owner",
        email,
        password: "secure-password",
      })
      .expect(201);
    const token = (
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email, password: "secure-password" })
        .expect(200)
    ).body.accessToken;
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Stamps",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 5,
      })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({ programId: program.body.id })
      .expect(201);
    const repo = app.get<WalletSyncRepository>(WalletSyncRepository);
    await expect(
      dataSource.transaction(async (manager) => {
        await repo.enqueueForAccount(
          manager,
          reg.body.businessId,
          account.body.id,
        );
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    expect(
      await dataSource.query(
        "SELECT id FROM wallet_sync_jobs WHERE account_id = ?",
        [account.body.id],
      ),
    ).toHaveLength(0);
  });

  it("coalesces committed ledger writes and sends the final stamp state", async () => {
    const email = `wallet-ledger-${Date.now()}@example.test`;
    emails.push(email);
    const registration = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "Ledger sync",
        ownerName: "Owner",
        email,
        password: "secure-password",
      })
      .expect(201);
    const token = (
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email, password: "secure-password" })
        .expect(200)
    ).body.accessToken;
    const auth = { Authorization: `Bearer ${token}` };
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(auth)
      .send({
        name: "Stamps",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 5,
        maxAccumulationsPerCardPerDay: 2,
      })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(auth)
      .send({ programId: program.body.id })
      .expect(201);
    const body = {
      cardCode: account.body.cardCode,
      branchId: registration.body.branchId,
    };
    const first = await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({ ...body, idempotencyKey: "wallet-first" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({ ...body, idempotencyKey: "wallet-second" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({ ...body, idempotencyKey: "wallet-first" })
      .expect(201);
    const jobs = await dataSource.query(
      "SELECT id, status FROM wallet_sync_jobs WHERE account_id = ?",
      [account.body.id],
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe("pending");
    expect(first.body.transaction.amount).toBe(1);
    const provider = app.get(WALLET_PROVIDER);
    const update = jest.spyOn(provider, "updatePass");
    await app.get(WalletSyncWorker).runDueJobs();
    expect(update).toHaveBeenCalledWith({
      cardCode: account.body.cardCode,
      mode: "stamps",
      balance: 2,
      progress: 2,
      goal: 5,
      rewardAvailable: false,
    });
    expect(
      (
        await dataSource.query(
          "SELECT status FROM wallet_sync_jobs WHERE account_id = ?",
          [account.body.id],
        )
      )[0].status,
    ).toBe("done");
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({ ...body, idempotencyKey: "wallet-first" })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(auth)
      .send({ ...body, idempotencyKey: "wallet-rejected" })
      .expect(409);
    const reward = await request(app.getHttpServer())
      .post(`/programs/${program.body.id}/rewards`)
      .set(auth)
      .send({ name: "Too costly", cost: 3 })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/redeem")
      .set(auth)
      .send({
        ...body,
        rewardId: reward.body.id,
        idempotencyKey: "wallet-insufficient",
      })
      .expect(409);
    expect(
      await dataSource.query(
        "SELECT id FROM wallet_sync_jobs WHERE account_id = ? AND status = 'pending'",
        [account.body.id],
      ),
    ).toHaveLength(0);
  });

  it("scopes failed jobs and manual retries by tenant; sync failure never changes balance", async () => {
    const suffix = `${Date.now()}-${Math.random()}`;
    const emailsAB = [
      `wallet-a-${suffix}@example.test`,
      `wallet-b-${suffix}@example.test`,
    ];
    emails.push(...emailsAB);
    const register = (email: string) =>
      request(app.getHttpServer())
        .post("/businesses/register")
        .send({
          businessName: "Wallet",
          ownerName: "Owner",
          email,
          password: "secure-password",
        })
        .expect(201);
    const [a, b] = await Promise.all(emailsAB.map(register));
    const [la, lb] = await Promise.all(
      emailsAB.map((email) =>
        request(app.getHttpServer())
          .post("/auth/login")
          .send({ email, password: "secure-password" })
          .expect(200),
      ),
    );
    const authA = { Authorization: `Bearer ${la.body.accessToken}` },
      authB = { Authorization: `Bearer ${lb.body.accessToken}` };
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(authA)
      .send({
        name: "Stamps",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 5,
      })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(authA)
      .send({ programId: program.body.id })
      .expect(201);
    await dataSource.query(
      "INSERT INTO wallet_sync_jobs (id,business_id,account_id,status,attempts,next_attempt_at,last_error) VALUES (UUID(),?,?, 'failed',6,CURRENT_TIMESTAMP,'failed')",
      [a.body.businessId, account.body.id],
    );
    await request(app.getHttpServer())
      .get("/wallet-sync/failed")
      .set(authB)
      .expect(200)
      .expect((r) => expect(r.body).toHaveLength(0));
    const failed = await request(app.getHttpServer())
      .get("/wallet-sync/failed")
      .set(authA)
      .expect(200);
    const id = failed.body[0].id;
    await request(app.getHttpServer())
      .post(`/wallet-sync/${id}/retry`)
      .set(authB)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/wallet-sync/${id}/retry`)
      .set(authA)
      .expect(201);
    const job = await dataSource.query(
      "SELECT status, attempts FROM wallet_sync_jobs WHERE id = ?",
      [id],
    );
    expect(job[0]).toMatchObject({ status: "pending", attempts: 0 });
    await dataSource.query(
      "UPDATE wallet_sync_jobs SET status='processing' WHERE id = ?",
      [id],
    );
    const worker = app.get<WalletSyncWorker>(WalletSyncWorker);
    const provider = app.get(WALLET_PROVIDER);
    const before = await dataSource.query(
      "SELECT balance FROM loyalty_accounts WHERE id = ?",
      [account.body.id],
    );
    jest
      .spyOn(provider, "updatePass")
      .mockRejectedValueOnce(new Error("temporary failure"));
    await (worker as unknown as { process(id: string): Promise<void> }).process(
      id,
    );
    const after = await dataSource.query(
      "SELECT balance FROM loyalty_accounts WHERE id = ?",
      [account.body.id],
    );
    expect(Number(after[0].balance)).toBe(Number(before[0].balance));
    const retried = await dataSource.query(
      "SELECT status, attempts, last_error FROM wallet_sync_jobs WHERE id = ?",
      [id],
    );
    expect(retried[0]).toMatchObject({
      status: "pending",
      attempts: 1,
      last_error: "temporary failure",
    });
  });

  it("recovers stale leases, prunes retained done jobs, and times out a stuck provider", async () => {
    const email = `wallet-lifecycle-${Date.now()}@example.test`;
    emails.push(email);
    const registration = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "Lifecycle",
        ownerName: "Owner",
        email,
        password: "secure-password",
      })
      .expect(201);
    const token = (
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email, password: "secure-password" })
        .expect(200)
    ).body.accessToken;
    const auth = { Authorization: `Bearer ${token}` };
    const program = await request(app.getHttpServer())
      .post("/programs")
      .set(auth)
      .send({
        name: "Stamps",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 5,
      })
      .expect(201);
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(auth)
      .send({ programId: program.body.id })
      .expect(201);
    const jobId = "a0000000-0000-4000-8000-000000000001";
    const retainedId = "a0000000-0000-4000-8000-000000000002";
    await dataSource.query(
      `INSERT INTO wallet_sync_jobs (id,business_id,account_id,status,attempts,next_attempt_at,pending_account_id,locked_at)
      VALUES (?, ?, ?, 'processing', 0, CURRENT_TIMESTAMP, NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 301 SECOND))`,
      [jobId, registration.body.businessId, account.body.id],
    );
    await dataSource.query(
      `INSERT INTO wallet_sync_jobs (id,business_id,account_id,status,attempts,next_attempt_at,pending_account_id,updated_at)
      VALUES (?, ?, ?, 'done', 0, CURRENT_TIMESTAMP, NULL, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 8 DAY))`,
      [retainedId, registration.body.businessId, account.body.id],
    );
    process.env.WALLET_SYNC_LEASE_SECONDS = "300";
    process.env.WALLET_SYNC_RETENTION_DAYS = "7";
    process.env.WALLET_SYNC_PROVIDER_TIMEOUT_MS = "20";
    const provider = app.get(WALLET_PROVIDER);
    jest
      .spyOn(provider, "updatePass")
      .mockReturnValueOnce(new Promise<void>(() => undefined));
    try {
      await app.get(WalletSyncWorker).runDueJobs();
    } finally {
      delete process.env.WALLET_SYNC_LEASE_SECONDS;
      delete process.env.WALLET_SYNC_RETENTION_DAYS;
      delete process.env.WALLET_SYNC_PROVIDER_TIMEOUT_MS;
    }
    const recovered = await dataSource.query(
      "SELECT status, attempts, last_error, locked_at FROM wallet_sync_jobs WHERE id = ?",
      [jobId],
    );
    expect(recovered[0]).toMatchObject({
      status: "pending",
      attempts: 2,
      last_error: "Wallet provider timed out",
      locked_at: null,
    });
    expect(
      await dataSource.query("SELECT id FROM wallet_sync_jobs WHERE id = ?", [
        retainedId,
      ]),
    ).toHaveLength(0);
  });
});
