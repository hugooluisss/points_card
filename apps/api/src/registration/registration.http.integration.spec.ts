import "reflect-metadata";
process.env.NODE_ENV = "test";
import { config } from "dotenv";
config({ path: "apps/api/.env", quiet: true });
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DataSource } from "typeorm";
import { AppModule } from "../app.module";
import { configureApp } from "../configure-app";
import { Clock } from "../ledger/clock";
import { RECOVERY_NOTIFIER, RecoveryNotifier } from "./recovery-notifier";

describe("registration HTTP", () => {
  let app: INestApplication;
  let db: DataSource;
  let now = new Date("2026-10-12T18:00:00.000Z");
  const notifications: { destination: string; link: string }[] = [];
  const createdBusinesses: string[] = [];
  const notifier: RecoveryNotifier = {
    send: async (destination, link) => {
      notifications.push({ destination, link });
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RECOVERY_NOTIFIER)
      .useValue(notifier)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    app.get(Clock).now = () => new Date(now);
    db = app.get(DataSource);
    await db.query("SET time_zone = '+00:00'");
    await db.runMigrations();
  });

  afterEach(async () => {
    for (const id of createdBusinesses.splice(0))
      await db.getRepository("Business").delete(id);
    notifications.splice(0);
  });
  afterAll(async () => {
    await app.close();
  });

  async function tenant(label: string) {
    const email = `${label}-${Date.now()}-${Math.random()}@example.test`;
    const password = "secure-password";
    const registered = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({ businessName: label, ownerName: "Owner", email, password })
      .expect(201);
    createdBusinesses.push(registered.body.businessId);
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };
    const business = await db.query(
      "SELECT public_code FROM businesses WHERE id = ?",
      [registered.body.businessId],
    );
    return {
      auth,
      code: business[0].public_code as string,
      businessId: registered.body.businessId as string,
    };
  }
  async function program(auth: Record<string, string>, name: string) {
    const created = await request(app.getHttpServer())
      .post("/programs")
      .set(auth)
      .send({
        name,
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 10,
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/programs/${created.body.id}/activate`)
      .set(auth)
      .expect(200);
    return created;
  }
  const body = (extra: Record<string, unknown> = {}) => ({
    name: "Ana",
    email: "ana@example.test",
    acceptPrivacy: true,
    acceptMarketing: false,
    website: "",
    startedAt: now.getTime() - 5000,
    ...extra,
  });

  it("validates settings, scopes tenants, emits a private QR, and lazily creates notice v1", async () => {
    const a = await tenant("registration-settings");
    const b = await tenant("registration-other");
    await request(app.getHttpServer())
      .put("/registration-settings")
      .set(a.auth)
      .send({
        fields: [
          { key: "name", required: true },
          { key: "email", required: true },
        ],
        brandColor: "red",
        logoUrl: null,
      })
      .expect(400);
    await request(app.getHttpServer())
      .put("/registration-settings")
      .set(a.auth)
      .send({
        fields: [{ key: "email", required: true }],
        brandColor: null,
        logoUrl: null,
      })
      .expect(400);
    await request(app.getHttpServer())
      .put("/registration-settings")
      .set(a.auth)
      .send({
        fields: [
          { key: "name", required: true },
          { key: "email", required: true },
        ],
        brandColor: "#12ABef",
        logoUrl: "https://example.test/logo.png",
      })
      .expect(200);
    await request(app.getHttpServer())
      .get("/registration-settings")
      .set(b.auth)
      .expect(200)
      .expect(({ body: settings }) => expect(settings.brandColor).toBeNull());
    const qr = await request(app.getHttpServer())
      .get("/registration-qr")
      .set(a.auth)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          callback(null, Buffer.concat(chunks).toString()),
        );
      })
      .expect(200);
    expect(qr.headers["content-type"]).toContain("image/svg+xml");
    expect(qr.body).toContain("<svg");
    expect(qr.body).not.toMatch(/ana@|\+?\d{10}/i);
    const page = await request(app.getHttpServer())
      .get(`/public/registration/${a.code}`)
      .expect(200);
    expect(page.body.privacyNotice).toMatchObject({ version: 1 });
    expect(page.body.privacyNotice.text).toContain("debe ser revisado");
    await request(app.getHttpServer())
      .get("/registration-settings")
      .set(b.auth)
      .expect(200);
    await request(app.getHttpServer())
      .get("/public/registration/unknown-code")
      .expect(404);
  });

  it("registers atomically, validates fields and traps, throttles, and suppresses duplicate cards", async () => {
    const t = await tenant("registration-flow");
    const firstProgram = await program(t.auth, "Program A");
    const created = await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send(body({ acceptMarketing: true }))
      .expect(201);
    expect(created.body).toMatchObject({ existing: false });
    expect(created.body.passes).toHaveLength(2);
    const customers = await db.query(
      "SELECT id, email FROM customers WHERE business_id = ?",
      [t.businessId],
    );
    expect(customers).toHaveLength(1);
    expect(customers[0].email).toBe("ana@example.test");
    const customerId = customers[0].id;
    expect(
      await db.query(
        "SELECT id FROM loyalty_accounts WHERE business_id = ? AND customer_id = ?",
        [t.businessId, customerId],
      ),
    ).toHaveLength(1);
    expect(
      await db.query(
        "SELECT platform, status FROM wallet_passes WHERE business_id = ?",
        [t.businessId],
      ),
    ).toHaveLength(2);
    expect(
      await db.query(
        "SELECT purpose, notice_version FROM consents WHERE customer_id = ? AND business_id = ?",
        [customerId, t.businessId],
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: "privacy_notice",
          notice_version: 1,
        }),
        expect.objectContaining({ purpose: "marketing", notice_version: null }),
      ]),
    );
    expect(notifications).toHaveLength(1);
    const manage = notifications[0].link.split("/").at(-1)!;
    expect(created.body).not.toHaveProperty("manageToken");
    await request(app.getHttpServer())
      .post("/public/consent/revoke")
      .send({ token: manage })
      .expect(201);
    await request(app.getHttpServer())
      .post("/public/consent/revoke")
      .send({ token: manage })
      .expect(404);
    expect(
      await db.query(
        "SELECT id FROM consents WHERE business_id = ? AND customer_id = ? AND purpose = 'marketing' AND status = 'revoked' AND origin = 'recovery_link'",
        [t.businessId, customerId],
      ),
    ).toHaveLength(1);

    const invalidInputs = [
      body({ name: "", email: undefined }),
      body({ email: "bad-email" }),
      body({ email: undefined, phone: "55-123" }),
      body({ birthday: "2099-99-99" }),
      body({ acceptPrivacy: false }),
    ];
    for (const invalid of invalidInputs)
      await request(app.getHttpServer())
        .post(`/public/registration/${t.code}`)
        .send(invalid)
        .expect(400);
    const counts = async () =>
      Number(
        (
          await db.query(
            "SELECT COUNT(*) AS n FROM customers WHERE business_id = ?",
            [t.businessId],
          )
        )[0].n,
      );
    const beforeTrap = await counts();
    await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send(body({ website: "filled" }))
      .expect(201);
    expect(await counts()).toBe(beforeTrap);
    await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send(body({ startedAt: now.getTime() }))
      .expect(400);
    await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send(body({ startedAt: now.getTime() - 86_400_001 }))
      .expect(400);
    now = new Date(now.getTime() + 3_600_001);
    app.get(Clock).now = () => new Date(now);
    for (let index = 0; index < 10; index++)
      await request(app.getHttpServer())
        .post(`/public/registration/${t.code}`)
        .send(body({ email: `rate-${index}@example.test` }))
        .expect(201);
    await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send(body({ email: "rate-11@example.test" }))
      .expect(429);
    expect(firstProgram.body.id).toBeTruthy();
  });

  it("deduplicates normalized email and phone and makes recovery tokens single use under concurrency", async () => {
    const t = await tenant("registration-recovery");
    await request(app.getHttpServer())
      .put("/registration-settings")
      .set(t.auth)
      .send({
        fields: [
          { key: "name", required: true },
          { key: "phone", required: true },
        ],
        brandColor: null,
        logoUrl: null,
      })
      .expect(200);
    await program(t.auth, "Recovery Program");
    await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send({
        name: "Ana",
        phone: "+52 (55) 1234-5678",
        acceptPrivacy: true,
        acceptMarketing: false,
        website: "",
        startedAt: now.getTime() - 5000,
      })
      .expect(201);
    expect(
      await db.query("SELECT phone FROM customers WHERE business_id = ?", [
        t.businessId,
      ]),
    ).toEqual([expect.objectContaining({ phone: "525512345678" })]);
    const duplicateResult = await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send({
        name: "Ana",
        phone: "525512345678",
        acceptPrivacy: true,
        acceptMarketing: false,
        website: "",
        startedAt: now.getTime() - 5000,
      })
      .expect(200);
    expect(duplicateResult.body).toBeDefined();
    expect(duplicateResult.body.existing).toBe(true);
    expect(notifications).toHaveLength(1);
    const token = notifications[0].link.split("/").at(-1)!;
    const [one, two] = await Promise.all([
      request(app.getHttpServer()).get(`/public/card/${token}`),
      request(app.getHttpServer()).get(`/public/card/${token}`),
    ]);
    expect([one.status, two.status].sort()).toEqual([200, 410]);
    await request(app.getHttpServer()).get(`/public/card/${token}`).expect(410);
    await request(app.getHttpServer()).get("/public/card/unknown").expect(410);

    await request(app.getHttpServer())
      .put("/registration-settings")
      .set(t.auth)
      .send({
        fields: [
          { key: "name", required: true },
          { key: "email", required: true },
        ],
        brandColor: null,
        logoUrl: null,
      })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send({
        name: "Ana",
        email: "second@example.test",
        acceptPrivacy: true,
        acceptMarketing: false,
        website: "",
        startedAt: now.getTime() - 5000,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/public/registration/${t.code}`)
      .send({
        name: "Ana",
        email: " SECOND@EXAMPLE.TEST ",
        acceptPrivacy: true,
        acceptMarketing: false,
        website: "",
        startedAt: now.getTime() - 5000,
      })
      .expect(200);
    expect(notifications).toHaveLength(2);
    const expiryToken = "known-expired";
    const hash = require("node:crypto")
      .createHmac("sha256", process.env.JWT_REFRESH_SECRET)
      .update(expiryToken)
      .digest("hex");
    const customer = await db.query(
      "SELECT id FROM customers WHERE business_id = ? LIMIT 1",
      [t.businessId],
    );
    await db.query(
      "INSERT INTO card_recovery_tokens (id,business_id,customer_id,token_hash,expires_at,used_at) VALUES (UUID(),?,?,?, ?,NULL)",
      [t.businessId, customer[0].id, hash, new Date(now.getTime() - 1000)],
    );
    await request(app.getHttpServer())
      .get(`/public/card/${expiryToken}`)
      .expect(410);
  });

  it("rejects no active program and scopes card disable/reissue to the tenant", async () => {
    const a = await tenant("registration-cards-a");
    const b = await tenant("registration-cards-b");
    await request(app.getHttpServer())
      .post(`/public/registration/${a.code}`)
      .send(body())
      .expect(409);
    const p = await program(a.auth, "Card Program");
    await request(app.getHttpServer())
      .post(`/public/registration/${a.code}`)
      .send(body({ email: "cards@example.test" }))
      .expect(201);
    const account = await db.query(
      "SELECT id, card_code FROM loyalty_accounts WHERE business_id = ?",
      [a.businessId],
    );
    const accountId = account[0].id;
    await db.query("UPDATE loyalty_accounts SET balance = 6 WHERE id = ?", [
      accountId,
    ]);
    await request(app.getHttpServer())
      .post(`/cards/${accountId}/reissue`)
      .set(b.auth)
      .expect(404);
    const reissued = await request(app.getHttpServer())
      .post(`/cards/${accountId}/reissue`)
      .set(a.auth)
      .expect(201);
    expect(reissued.body.balance).toBe(6);
    expect(reissued.body.cardCode).not.toBe(account[0].card_code);
    await request(app.getHttpServer())
      .get(`/cards/${account[0].card_code}`)
      .set(a.auth)
      .expect(404);
    expect(
      await db.query(
        "SELECT status FROM wallet_passes WHERE business_id = ? AND account_id = ? ORDER BY created_at",
        [a.businessId, accountId],
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "disabled" }),
        expect.objectContaining({ status: "issued" }),
      ]),
    );
    await request(app.getHttpServer())
      .post(`/cards/${accountId}/disable`)
      .set(b.auth)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/cards/${accountId}/disable`)
      .set(a.auth)
      .expect(201);
    await request(app.getHttpServer())
      .get(`/cards/${reissued.body.cardCode}`)
      .set(a.auth)
      .expect(404);
    expect(p.body.id).toBeTruthy();
  });
});
