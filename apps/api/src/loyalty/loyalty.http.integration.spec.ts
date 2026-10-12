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

describe("loyalty programs HTTP", () => {
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
      databaseOptions(
        new ConfigService({ ...process.env, NODE_ENV: "test" }),
        process.env.DB_DATABASE_TEST!,
      ),
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

  it("validates rules, scopes programs and rewards by tenant, and restricts writes to owner/manager", async () => {
    const suffix = `${Date.now()}-${Math.random()}`;
    const emailA = `loyalty-a-${suffix}@example.test`,
      emailB = `loyalty-b-${suffix}@example.test`;
    emails.push(emailA, emailB);
    const password = "secure-password";
    const a = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "A",
        ownerName: "Owner A",
        email: emailA,
        password,
      })
      .expect(201);
    const b = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "B",
        ownerName: "Owner B",
        email: emailB,
        password,
      })
      .expect(201);
    const loginA = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: emailA, password })
      .expect(200);
    const loginB = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: emailB, password })
      .expect(200);
    const authA = { Authorization: `Bearer ${loginA.body.accessToken}` },
      authB = { Authorization: `Bearer ${loginB.body.accessToken}` };
    await request(app.getHttpServer())
      .post("/programs")
      .set(authA)
      .send({
        name: "Invalid",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 0,
      })
      .expect(400);
    const created = await request(app.getHttpServer())
      .post("/programs")
      .set(authA)
      .send({
        name: "Sellos con nulos",
        mode: "stamps",
        validFrom: "2026-10-11",
        validUntil: "2026-12-31",
        stampsGoal: 5,
        pointsPerCurrencyUnit: null,
        minIntervalMinutes: null,
        maxAccumulationsPerCardPerDay: null,
        maxAccumulationsPerStaffPerDay: null,
        maxPointsPerOperation: null,
        staffDailyAlertThreshold: null,
      })
      .expect(201);
    expect(created.body).toEqual(
      expect.objectContaining({
        validFrom: "2026-10-11",
        validUntil: "2026-12-31",
        pointsPerCurrencyUnit: null,
      }),
    );
    const fetched = await request(app.getHttpServer())
      .get(`/programs/${created.body.id}`)
      .set(authA)
      .expect(200);
    const listed = await request(app.getHttpServer())
      .get("/programs")
      .set(authA)
      .expect(200);
    expect(fetched.body).toEqual(
      expect.objectContaining({
        validFrom: "2026-10-11",
        validUntil: "2026-12-31",
      }),
    );
    expect(listed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.body.id,
          validFrom: "2026-10-11",
          validUntil: "2026-12-31",
        }),
      ]),
    );
    const updatedStamps = await request(app.getHttpServer())
      .patch(`/programs/${created.body.id}`)
      .set(authA)
      .send({
        validFrom: "2026-10-11",
        validUntil: null,
        stampsGoal: 5,
        pointsPerCurrencyUnit: null,
        minIntervalMinutes: null,
        maxAccumulationsPerCardPerDay: null,
        maxAccumulationsPerStaffPerDay: null,
        maxPointsPerOperation: null,
        staffDailyAlertThreshold: null,
      })
      .expect(200);
    expect(updatedStamps.body).toEqual(
      expect.objectContaining({ validFrom: "2026-10-11", validUntil: null }),
    );
    const points = await request(app.getHttpServer())
      .post("/programs")
      .set(authA)
      .send({
        name: "Puntos con nulos",
        mode: "points",
        validFrom: "2026-10-11",
        validUntil: null,
        stampsGoal: null,
        pointsPerCurrencyUnit: 1.25,
        minIntervalMinutes: null,
        maxAccumulationsPerCardPerDay: null,
        maxAccumulationsPerStaffPerDay: null,
        maxPointsPerOperation: null,
        staffDailyAlertThreshold: null,
      })
      .expect(201);
    const updatedPoints = await request(app.getHttpServer())
      .patch(`/programs/${points.body.id}`)
      .set(authA)
      .send({
        validUntil: null,
        stampsGoal: null,
        pointsPerCurrencyUnit: 1.25,
        minIntervalMinutes: null,
        maxAccumulationsPerCardPerDay: null,
        maxAccumulationsPerStaffPerDay: null,
        maxPointsPerOperation: null,
        staffDailyAlertThreshold: null,
      })
      .expect(200);
    expect(updatedPoints.body).toEqual(
      expect.objectContaining({
        stampsGoal: null,
        pointsPerCurrencyUnit: "1.2500",
      }),
    );
    await request(app.getHttpServer())
      .patch(`/programs/${created.body.id}/activate`)
      .set(authA)
      .expect(200);
    const second = await request(app.getHttpServer())
      .post("/programs")
      .set(authA)
      .send({
        name: "Otro",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 3,
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/programs/${second.body.id}/activate`)
      .set(authA)
      .expect(409);
    await request(app.getHttpServer())
      .patch(`/programs/${created.body.id}`)
      .set(authA)
      .send({ mode: "points" })
      .expect(400);
    const reward = await request(app.getHttpServer())
      .post(`/programs/${created.body.id}/rewards`)
      .set(authA)
      .send({ name: "Premio", cost: 4 })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/programs/${created.body.id}/rewards`)
      .set(authA)
      .send({ name: "Muy caro", cost: 6 })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/programs/${created.body.id}`)
      .set(authA)
      .send({ stampsGoal: 3 })
      .expect(400);
    await request(app.getHttpServer())
      .get(`/programs/${created.body.id}`)
      .set(authB)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/programs/${created.body.id}/rewards/${reward.body.id}`)
      .set(authB)
      .send({ cost: 2 })
      .expect(404);
    const removed = await request(app.getHttpServer())
      .delete(`/programs/${created.body.id}/rewards/${reward.body.id}`)
      .set(authA)
      .expect(200);
    expect(removed.body).toEqual(
      expect.objectContaining({ id: reward.body.id, isActive: false }),
    );
    const allRewards = await request(app.getHttpServer())
      .get(`/programs/${created.body.id}/rewards`)
      .set(authA)
      .expect(200);
    expect(allRewards.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: reward.body.id, isActive: false }),
      ]),
    );
    const activeRewards = await request(app.getHttpServer())
      .get(`/programs/${created.body.id}/rewards?active=true`)
      .set(authA)
      .expect(200);
    expect(activeRewards.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: reward.body.id })]),
    );
    const cashierEmail = `loyalty-cashier-${suffix}@example.test`;
    emails.push(cashierEmail);
    await request(app.getHttpServer())
      .post("/staff")
      .set(authA)
      .send({ name: "Cashier", email: cashierEmail, password, role: "cashier" })
      .expect(201);
    const cashier = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: cashierEmail, password })
      .expect(200);
    await request(app.getHttpServer())
      .get("/programs")
      .set({ Authorization: `Bearer ${cashier.body.accessToken}` })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/programs/${created.body.id}/deactivate`)
      .set({ Authorization: `Bearer ${cashier.body.accessToken}` })
      .expect(403);
  });
});
