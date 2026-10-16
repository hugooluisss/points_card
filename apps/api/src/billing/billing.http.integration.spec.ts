import "reflect-metadata";
import { config } from "dotenv";
config({ path: "apps/api/.env", quiet: true });
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import Stripe from "stripe";
import request from "supertest";
import { AppModule } from "../app.module";
import { configureApp } from "../configure-app";
import { databaseOptions } from "../database/database.options";
import { Business } from "../businesses/entities/business.entity";
import { Clock } from "../ledger/clock";
import { FakeStripeGateway } from "./fake-stripe.gateway";
import { STRIPE_GATEWAY } from "./stripe-gateway";
import { Plan } from "./entities/plan.entity";
import { Subscription } from "./entities/subscription.entity";
import { BillingPortalService } from "./billing-portal.service";
import { BillingRepository } from "./billing.repository";

describe("billing HTTP and database behavior", () => {
  let app: INestApplication;
  let db: DataSource;
  let clock: Clock;
  let stripe: FakeStripeGateway;
  const now = new Date("2026-10-11T12:00:00.000Z");
  const emailList: string[] = [];
  const key = "sk_test_" + "x".repeat(32);
  const password = "secure-password";

  async function tenant(
    label: string,
    email = `${label}-${Date.now()}-${Math.random()}@example.test`,
  ) {
    emailList.push(email);
    const registered = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({ businessName: label, ownerName: "Owner", email, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    return {
      businessId: registered.body.businessId as string,
      branchId: registered.body.branchId as string,
      ownerId: registered.body.ownerId as string,
      auth: { Authorization: `Bearer ${login.body.accessToken}` },
      email,
    };
  }
  async function seedProgram(auth: Record<string, string>, name: string) {
    const p = await request(app.getHttpServer())
      .post("/programs")
      .set(auth)
      .send({ name, mode: "stamps", validFrom: "2026-01-01", stampsGoal: 4 })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/programs/${p.body.id}/activate`)
      .set(auth)
      .expect(200);
    return p.body.id as string;
  }
  function event(
    auth: Record<string, string> | null,
    type: string,
    object: object,
    id = `evt_${Date.now()}_${Math.random()}`,
    created = Math.floor(now.getTime() / 1000),
  ) {
    const payload = JSON.stringify({
      id,
      object: "event",
      api_version: "2025-09-30.clover",
      created,
      data: { object },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      type,
    });
    const signature = stripe.signature(payload);
    let req = request(app.getHttpServer())
      .post("/billing/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);
    if (auth) req = req.set(auth);
    return req;
  }
  async function sub(id: string) {
    return db.getRepository(Subscription).findOneByOrFail({ businessId: id });
  }

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.BILLING_GRACE_DAYS = "7";
    process.env.BILLING_RETENTION_DAYS = "90";
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(STRIPE_GATEWAY)
      .useClass(FakeStripeGateway)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(DataSource);
    await db.query("SET time_zone = '+00:00'");
    await db.runMigrations();
    clock = app.get(Clock);
    clock.now = () => new Date(now);
    stripe = app.get(STRIPE_GATEWAY) as FakeStripeGateway;
    stripe.isConfigured = true;
  });

  afterEach(async () => {
    for (const email of emailList.splice(0)) {
      const rows = await db.query(
        "SELECT business_id FROM staff_users WHERE email=?",
        [email],
      );
      for (const row of rows) {
        await db.query("DELETE FROM redemptions WHERE business_id=?", [
          row.business_id,
        ]);
        await db.query("DELETE FROM loyalty_transactions WHERE business_id=?", [
          row.business_id,
        ]);
        await db.query("DELETE FROM loyalty_accounts WHERE business_id=?", [
          row.business_id,
        ]);
        await db.query("DELETE FROM audit_logs WHERE business_id=?", [
          row.business_id,
        ]);
        await db.getRepository(Business).delete(row.business_id);
      }
    }
    stripe.customers = [];
    stripe.sessions = [];
    stripe.portalCustomers = [];
    stripe.remote.clear();
    stripe.isConfigured = true;
  });
  afterAll(async () => {
    await app?.close();
  });

  it("seeds plans, creates trials, and migrates expired trials", async () => {
    const plans = await db
      .getRepository(Plan)
      .find({ order: { priceMonthly: "ASC" } });
    expect(
      plans.map((p) => [
        p.name,
        Number(p.priceMonthly),
        p.currency,
        p.maxBranches,
        p.maxStaff,
        p.maxCards,
      ]),
    ).toEqual([
      ["Básico", 149, "MXN", 1, 3, 500],
      ["Negocio", 299, "MXN", 5, 15, 5000],
    ]);
    const t = await tenant("billing-trial");
    expect((await sub(t.businessId)).trialEndsAt.toISOString()).toBe(
      "2026-10-25T12:00:00.000Z",
    );
    const old = await db.getRepository(Business).save({
      name: "Preexisting",
      publicCode: `old${Date.now()}`.slice(-16),
      plan: "trial",
      status: "active",
      registrationFields: [],
    });
    await db.query("DELETE FROM subscriptions WHERE business_id=?", [old.id]);
    const basic = plans.find((p) => p.name === "Básico")!;
    await db.query(
      `INSERT INTO subscriptions
       (business_id,plan_id,status,trial_ends_at,created_at,updated_at)
       VALUES (?,?,'trial',?,?,?)`,
      [old.id, basic.id, new Date("2026-01-01T00:00:00Z"), now, now],
    );
    await app
      .get(
        require("./billing-reconciliation.service")
          .BillingReconciliationService,
      )
      .reconcile();
    expect((await sub(old.id)).status).toBe("past_due");
    await db.getRepository(Business).delete(old.id);
  });

  it("enforces Basic staff limits while reads work and exposes branch checks", async () => {
    const t = await tenant("billing-limits");
    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer())
        .post("/staff")
        .set(t.auth)
        .send({
          name: `Staff ${i}`,
          email: `staff-${i}-${t.email}`,
          password,
          role: "cashier",
        })
        .expect(201);
    }
    await request(app.getHttpServer())
      .get("/staff")
      .set(t.auth)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(3));
    const fourth = await request(app.getHttpServer())
      .post("/staff")
      .set(t.auth)
      .send({
        name: "Fourth",
        email: `fourth-${t.email}`,
        password,
        role: "cashier",
      })
      .expect(403);
    expect(fourth.body.message).toContain("Mejora tu plan");
    const plans = await db.getRepository(Plan).find();
    const basic = plans.find((p) => p.name === "Básico")!;
    await db.getRepository(Plan).update(basic.id, { maxStaff: 1 });
    await request(app.getHttpServer()).get("/staff").set(t.auth).expect(200);
    await db.getRepository(Plan).update(basic.id, { maxStaff: 3 });
    const limits = app.get(require("./plan-limits.service").PlanLimitsService);
    await expect(
      limits.assertCanCreate("branches", 1, t.businessId),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("gates creation while keeping reads and scanner operations available", async () => {
    const t = await tenant("billing-gates");
    const programId = await seedProgram(t.auth, "Gate stamps");
    const account = await request(app.getHttpServer())
      .post("/ledger/accounts")
      .set(t.auth)
      .send({ programId })
      .expect(201);
    const reward = await request(app.getHttpServer())
      .post(`/programs/${programId}/rewards`)
      .set(t.auth)
      .send({ name: "Reward", cost: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(t.auth)
      .send({
        cardCode: account.body.cardCode,
        branchId: t.branchId,
        idempotencyKey: "seed-card",
      })
      .expect(201);
    const update = async (
      status: Subscription["status"],
      trialEnd: Date,
      grace: Date | null,
    ) => {
      await db.getRepository(Subscription).update(t.businessId, {
        status,
        trialEndsAt: trialEnd,
        graceEndsAt: grace,
      });
    };
    const writable = [
      ["trial", new Date(now.getTime() + 1000), null],
      ["active", new Date("2000-01-01T00:00:00Z"), null],
      [
        "past_due",
        new Date("2000-01-01T00:00:00Z"),
        new Date(now.getTime() + 1000),
      ],
    ] as const;
    const staffCount = Number(
      (
        await db.query(
          "SELECT COUNT(*) AS n FROM staff_users WHERE business_id=? AND is_active=TRUE",
          [t.businessId],
        )
      )[0].n,
    );
    await db.query(
      `UPDATE plans SET max_staff=?
       WHERE id=(SELECT plan_id FROM subscriptions WHERE business_id=?)`,
      [staffCount + 1, t.businessId],
    );
    for (const [status, trialEnd, grace] of writable) {
      await update(status, trialEnd, grace);
      const extraAccount = await request(app.getHttpServer())
        .post("/ledger/accounts")
        .set(t.auth)
        .send({ programId })
        .expect(201);
      await db.query("DELETE FROM loyalty_accounts WHERE id=?", [
        extraAccount.body.id,
      ]);
    }
    const blocked = [
      [
        "past_due",
        new Date("2000-01-01T00:00:00Z"),
        new Date(now.getTime() - 1000),
      ],
      ["canceled", new Date(now.getTime() + 1000), null],
    ] as const;
    for (const [status, trialEnd, grace] of blocked) {
      await update(status, trialEnd, grace);
      await request(app.getHttpServer())
        .post("/staff")
        .set(t.auth)
        .send({
          name: "Blocked",
          email: `blocked-${status}-${t.email}`,
          password,
          role: "cashier",
        })
        .expect(402);
      await request(app.getHttpServer()).get("/staff").set(t.auth).expect(200);
      await request(app.getHttpServer())
        .get(`/cards/${account.body.cardCode}`)
        .set(t.auth)
        .expect(200);
      await request(app.getHttpServer())
        .get("/billing")
        .set(t.auth)
        .expect(200);
      await request(app.getHttpServer())
        .post("/ledger/accumulate")
        .set(t.auth)
        .send({
          cardCode: account.body.cardCode,
          branchId: t.branchId,
          idempotencyKey: `blocked-acc-${status}`,
        })
        .expect(201);
      await request(app.getHttpServer())
        .post("/ledger/redeem")
        .set(t.auth)
        .send({
          cardCode: account.body.cardCode,
          branchId: t.branchId,
          rewardId: reward.body.id,
          idempotencyKey: `blocked-red-${status}`,
        })
        .expect(201);
    }
    await update("trial", new Date(now.getTime() - 8 * 86_400_000), null);
    await request(app.getHttpServer())
      .post("/staff")
      .set(t.auth)
      .send({
        name: "Trial grace",
        email: `trial-grace-${t.email}`,
        password,
        role: "cashier",
      })
      .expect(402);
    expect((await sub(t.businessId)).status).toBe("past_due");
    await request(app.getHttpServer()).get("/staff").set(t.auth).expect(200);
    await request(app.getHttpServer())
      .get(`/cards/${account.body.cardCode}`)
      .set(t.auth)
      .expect(200);
    await request(app.getHttpServer()).get("/billing").set(t.auth).expect(200);
    await request(app.getHttpServer())
      .post("/ledger/accumulate")
      .set(t.auth)
      .send({
        cardCode: account.body.cardCode,
        branchId: t.branchId,
        idempotencyKey: "expired-trial-acc",
      })
      .expect(201);
    await request(app.getHttpServer())
      .post("/ledger/redeem")
      .set(t.auth)
      .send({
        cardCode: account.body.cardCode,
        branchId: t.branchId,
        rewardId: reward.body.id,
        idempotencyKey: "expired-trial-red",
      })
      .expect(201);
  });

  it("scopes checkout and portal to owners, rejecting missing prices", async () => {
    const t = await tenant("billing-checkout");
    const plans = await db.getRepository(Plan).find();
    const basic = plans.find((p) => p.name === "Básico")!;
    await db
      .getRepository(Plan)
      .update(basic.id, { stripePriceId: "price_basic_test" });
    const first = await request(app.getHttpServer())
      .post("/billing/checkout")
      .set(t.auth)
      .send({ planId: basic.id })
      .expect(201);
    expect(first.body.url).toContain("stripe.example/checkout");
    expect((await sub(t.businessId)).stripeCustomerId).toBe(
      `cus_${t.businessId}`,
    );
    await request(app.getHttpServer())
      .post("/billing/checkout")
      .set(t.auth)
      .send({ planId: basic.id })
      .expect(201);
    expect(stripe.customers).toHaveLength(1);
    expect(stripe.sessions).toHaveLength(2);
    await db.getRepository(Plan).update(basic.id, { stripePriceId: null });
    await request(app.getHttpServer())
      .post("/billing/checkout")
      .set(t.auth)
      .send({ planId: basic.id })
      .expect(409)
      .expect((r) =>
        expect(r.body.message).toContain("configurado para cobro"),
      );
    const cashierEmail = `cashier-${t.email}`;
    emailList.push(cashierEmail);
    const cashier = await request(app.getHttpServer())
      .post("/staff")
      .set(t.auth)
      .send({ name: "Cashier", email: cashierEmail, password, role: "cashier" })
      .expect(201);
    const cashierLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: cashierEmail, password })
      .expect(200);
    await request(app.getHttpServer())
      .post("/billing/portal")
      .set({ Authorization: `Bearer ${cashierLogin.body.accessToken}` })
      .expect(403);
    await request(app.getHttpServer())
      .post("/billing/checkout")
      .set({ Authorization: `Bearer ${cashierLogin.body.accessToken}` })
      .send({ planId: basic.id })
      .expect(403);
    await db.query("UPDATE staff_users SET role='manager' WHERE id=?", [
      cashier.body.id,
    ]);
    const managerLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: cashierEmail, password })
      .expect(200);
    await request(app.getHttpServer())
      .post("/billing/checkout")
      .set({ Authorization: `Bearer ${managerLogin.body.accessToken}` })
      .send({ planId: basic.id })
      .expect(403);
    const other = await tenant("billing-other");
    await db
      .getRepository(Subscription)
      .update(t.businessId, { stripeCustomerId: "cus_owner" });
    await db
      .getRepository(Subscription)
      .update(other.businessId, { stripeCustomerId: "cus_other" });
    await request(app.getHttpServer())
      .post("/billing/portal")
      .set(t.auth)
      .expect(201);
    expect(stripe.portalCustomers.at(-1)).toBe("cus_owner");
    const portalService = app.get(BillingPortalService);
    await expect(portalService.portal()).rejects.toBeDefined();
    await request(app.getHttpServer())
      .get("/billing")
      .set(t.auth)
      .expect(200)
      .expect((r) => expect(r.body.status).not.toBe(other.businessId));
    await request(app.getHttpServer())
      .post("/billing/checkout")
      .set(other.auth)
      .send({ planId: basic.id })
      .expect(409);
  });

  it("requires Stripe configuration for payment actions", async () => {
    const t = await tenant("billing-unconfigured");
    const basic = (await db.getRepository(Plan).find()).find(
      (p) => p.name === "Básico",
    )!;
    stripe.isConfigured = false;
    await request(app.getHttpServer())
      .post("/billing/portal")
      .set(t.auth)
      .expect(503)
      .expect((r) =>
        expect(r.body.message).toBe("El cobro aún no está configurado."),
      );
    await request(app.getHttpServer())
      .post("/billing/checkout")
      .set(t.auth)
      .send({ planId: basic.id })
      .expect(503)
      .expect((r) =>
        expect(r.body.message).toBe("El cobro aún no está configurado."),
      );
  });

  it("verifies, deduplicates, orders, cancels, and reactivates webhook events", async () => {
    const t = await tenant("billing-webhook");
    const plan = (await db.getRepository(Plan).find()).find(
      (p) => p.name === "Negocio",
    )!;
    const customer = `cus_${t.businessId}`;
    await db.getRepository(Subscription).update(t.businessId, {
      stripeCustomerId: customer,
      planId: plan.id,
      stripeSubscriptionId: "sub_test",
    });
    const invalid = await request(app.getHttpServer())
      .post("/billing/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=1,v1=invalid")
      .send(JSON.stringify({ id: "evt_bad" }))
      .expect(400);
    expect(invalid.body.message).toContain("firma");
    expect(
      await db.query(
        "SELECT stripe_event_id FROM billing_events WHERE stripe_event_id='evt_bad'",
      ),
    ).toHaveLength(0);
    await request(app.getHttpServer())
      .post("/billing/webhook")
      .send({ id: "evt_missing" })
      .expect(400);
    expect(
      await db.query(
        "SELECT stripe_event_id FROM billing_events WHERE stripe_event_id='evt_missing'",
      ),
    ).toHaveLength(0);
    const failed = {
      id: "in_test",
      customer,
      subscription: "sub_test",
      lines: {
        data: [{ period: { end: Math.floor(now.getTime() / 1000) + 86400 } }],
      },
    };
    const failResp = await event(
      null,
      "invoice.payment_failed",
      failed,
      "evt_failed",
    ).expect(201);
    expect(failResp.body.received).toBe(true);
    expect((await sub(t.businessId)).status).toBe("past_due");
    expect((await sub(t.businessId)).graceEndsAt!.toISOString()).toBe(
      "2026-10-18T12:00:00.000Z",
    );
    await event(null, "invoice.payment_failed", failed, "evt_failed").expect(
      201,
    );
    expect(
      await db.query(
        "SELECT stripe_event_id FROM billing_events WHERE stripe_event_id='evt_failed'",
      ),
    ).toHaveLength(1);
    await event(
      null,
      "invoice.paid",
      failed,
      "evt_paid",
      Math.floor(now.getTime() / 1000) + 1,
    ).expect(201);
    expect((await sub(t.businessId)).status).toBe("active");
    expect((await sub(t.businessId)).graceEndsAt).toBeNull();
    await event(
      null,
      "invoice.payment_failed",
      failed,
      "evt_stale",
      Math.floor(now.getTime() / 1000) - 1,
    ).expect(201);
    expect((await sub(t.businessId)).status).toBe("active");
    const paidPeriodEnd = (await sub(t.businessId)).currentPeriodEnd!.getTime();
    const oldPeriodInvoice = {
      ...failed,
      lines: {
        data: [{ period: { end: Math.floor(paidPeriodEnd / 1000) - 10 } }],
      },
    };
    await event(
      null,
      "invoice.payment_failed",
      oldPeriodInvoice,
      "evt_old_period",
      Math.floor(now.getTime() / 1000) + 2,
    ).expect(201);
    expect((await sub(t.businessId)).status).toBe("active");
    const subscription = {
      id: "sub_test",
      customer,
      metadata: { businessId: t.businessId },
      status: "canceled",
      current_period_end: Math.floor(now.getTime() / 1000) - 500,
      items: {
        data: [
          { current_period_end: Math.floor(now.getTime() / 1000) + 86400 },
        ],
      },
      cancel_at_period_end: false,
    };
    await event(
      null,
      "customer.subscription.deleted",
      subscription,
      "evt_deleted",
      Math.floor(now.getTime() / 1000) + 2,
    ).expect(201);
    expect((await sub(t.businessId)).status).toBe("canceled");
    expect((await sub(t.businessId)).retentionEndsAt!.toISOString()).toBe(
      "2027-01-09T12:00:00.000Z",
    );
    const checkout = {
      id: "cs_test",
      client_reference_id: t.businessId,
      customer,
      subscription: "sub_new",
      metadata: { businessId: t.businessId, planId: plan.id },
    };
    await event(
      null,
      "checkout.session.completed",
      checkout,
      "evt_checkout",
      Math.floor(now.getTime() / 1000) + 3,
    ).expect(201);
    expect((await sub(t.businessId)).status).toBe("active");
    expect((await sub(t.businessId)).currentPeriodEnd!.toISOString()).toBe(
      "2026-10-12T12:00:00.000Z",
    );
    expect(
      await db.query("SELECT id FROM businesses WHERE id=?", [t.businessId]),
    ).toHaveLength(1);
    const updated = {
      ...subscription,
      status: "active",
      current_period_end: Math.floor(now.getTime() / 1000) + 86400,
    };
    await event(
      null,
      "customer.subscription.updated",
      updated,
      "evt_updated",
      Math.floor(now.getTime() / 1000) + 4,
    ).expect(201);
    expect((await sub(t.businessId)).status).toBe("active");
  });

  it("releases failed webhook claims so Stripe retries can apply exactly once", async () => {
    const t = await tenant("billing-webhook-retry");
    const customer = `cus_${t.businessId}`;
    await db.getRepository(Subscription).update(t.businessId, {
      stripeCustomerId: customer,
      status: "past_due",
      graceEndsAt: new Date(now.getTime() + 86_400_000),
    });
    const eventObject = {
      id: "in_retry",
      customer,
      lines: {
        data: [{ period: { end: Math.floor(now.getTime() / 1000) + 86400 } }],
      },
    };
    const billing = app.get(BillingRepository);
    const save = jest
      .spyOn(billing, "saveSubscription")
      .mockRejectedValueOnce(new Error("temporary DB error"));
    await event(null, "invoice.paid", eventObject, "evt_retry").expect(500);
    const [failed] = await db.query(
      "SELECT processed_at, processing_until FROM billing_events WHERE stripe_event_id='evt_retry'",
    );
    expect(failed.processed_at).toBeNull();
    expect(failed.processing_until).toBeNull();
    await event(null, "invoice.paid", eventObject, "evt_retry").expect(201);
    expect((await sub(t.businessId)).status).toBe("active");
    await event(null, "invoice.paid", eventObject, "evt_retry").expect(201);
    expect(save).toHaveBeenCalledTimes(2);
    save.mockRestore();
  });

  it("allows only one concurrent delivery to apply and acknowledges ignored events", async () => {
    const t = await tenant("billing-webhook-race");
    const customer = `cus_${t.businessId}`;
    await db.getRepository(Subscription).update(t.businessId, {
      stripeCustomerId: customer,
      status: "past_due",
    });
    const eventObject = {
      id: "in_race",
      customer,
      lines: {
        data: [{ period: { end: Math.floor(now.getTime() / 1000) + 86400 } }],
      },
    };
    const billing = app.get(BillingRepository);
    let entered!: () => void;
    let release!: () => void;
    const isEntered = new Promise<void>((resolve) => (entered = resolve));
    const isReleased = new Promise<void>((resolve) => (release = resolve));
    const originalSave = billing.saveSubscription.bind(billing);
    const save = jest
      .spyOn(billing, "saveSubscription")
      .mockImplementation(async (values) => {
        entered();
        await isReleased;
        return originalSave(values);
      });
    const first = event(null, "invoice.paid", eventObject, "evt_race");
    const firstResponse = first.then((response) => response);
    await isEntered;
    await event(null, "invoice.paid", eventObject, "evt_race").expect(201);
    release();
    await expect(firstResponse).resolves.toMatchObject({ status: 201 });
    expect(save).toHaveBeenCalledTimes(1);
    save.mockRestore();
    const before = await sub(t.businessId);
    await event(
      null,
      "invoice.paid",
      { ...eventObject, customer: "cus_missing" },
      "evt_unknown_business",
    ).expect(201);
    await event(
      null,
      "customer.created",
      { id: "cus_unknown" },
      "evt_unknown_type",
    ).expect(201);
    expect((await sub(t.businessId)).status).toBe(before.status);
  });

  it("reconciles Stripe drift and keeps endpoints tenant scoped", async () => {
    const a = await tenant("billing-tenant-a");
    const b = await tenant("billing-tenant-b");
    await db.getRepository(Subscription).update(a.businessId, {
      status: "active",
      stripeSubscriptionId: "sub_a",
    });
    await db.getRepository(Subscription).update(b.businessId, {
      status: "canceled",
      stripeSubscriptionId: "sub_b",
    });
    const remote = (status: string) =>
      ({
        id: "sub_a",
        status,
        current_period_end: Math.floor(now.getTime() / 1000) + 3600,
      }) as unknown as Stripe.Subscription;
    stripe.remote.set("sub_a", remote("canceled"));
    stripe.remote.set("sub_b", { ...remote("active"), id: "sub_b" });
    const reconciliation = app.get(
      require("./billing-reconciliation.service").BillingReconciliationService,
    );
    await reconciliation.reconcile();
    expect((await sub(a.businessId)).status).toBe("canceled");
    expect((await sub(b.businessId)).status).toBe("canceled");
    await db
      .getRepository(Subscription)
      .update(b.businessId, { status: "active" });
    stripe.remote.set("sub_b", { ...remote("active"), id: "sub_b" });
    await reconciliation.reconcile();
    expect((await sub(b.businessId)).status).toBe("active");
    stripe.isConfigured = false;
    await db
      .getRepository(Subscription)
      .update(a.businessId, { status: "active" });
    await reconciliation.reconcile();
    expect((await sub(a.businessId)).status).toBe("active");
    const currentA = await sub(a.businessId);
    await request(app.getHttpServer())
      .get("/billing")
      .set(a.auth)
      .expect(200)
      .expect((r) => expect(r.body.plan.id).toBe(currentA.planId));
  });
});
