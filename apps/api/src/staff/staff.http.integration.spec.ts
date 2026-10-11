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

describe("staff auth and management HTTP", () => {
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

  it("logs in, rotates the cookie, scopes owner staff actions, and audits cross-tenant denial", async () => {
    const suffix = `${Date.now()}-${Math.random()}`;
    const ownerEmail = `staff-owner-${suffix}@example.test`,
      otherEmail = `staff-other-${suffix}@example.test`;
    emails.push(ownerEmail, otherEmail);
    const password = "secure-password";
    const first = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "First",
        ownerName: "Owner One",
        email: ownerEmail,
        password,
      })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({
        businessName: "Second",
        ownerName: "Owner Two",
        email: otherEmail,
        password,
      })
      .expect(201);
    const ownerLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: ownerEmail, password })
      .expect(200);
    expect(ownerLogin.body.user).toEqual(
      expect.objectContaining({
        id: first.body.ownerId,
        businessId: first.body.businessId,
        role: "owner",
        branchIds: null,
      }),
    );
    expect(ownerLogin.headers["set-cookie"][0]).toMatch(
      /pc_refresh=.*HttpOnly.*SameSite=Lax.*Path=\/points-card-api\/auth/,
    );
    const rotated = await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", ownerLogin.headers["set-cookie"])
      .expect(200);
    expect(rotated.body).toHaveProperty("accessToken");
    expect(
      await request(app.getHttpServer())
        .get("/auth/me")
        .set("Authorization", `Bearer ${rotated.body.accessToken}`)
        .expect(200)
        .then((r) => r.body.user.id),
    ).toBe(first.body.ownerId);

    const cashierEmail = `cashier-${suffix}@example.test`;
    emails.push(cashierEmail);
    const cashier = await request(app.getHttpServer())
      .post("/staff")
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .send({
        name: "Cashier",
        email: cashierEmail,
        password,
        role: "cashier",
        branchIds: [first.body.branchId],
      })
      .expect(201);
    expect(cashier.body).not.toHaveProperty("passwordHash");
    await request(app.getHttpServer())
      .get("/staff")
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: cashier.body.id, role: "cashier" }),
          ]),
        ),
      );
    await request(app.getHttpServer())
      .patch(`/staff/${cashier.body.id}/role`)
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .send({ role: "manager" })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/staff/${cashier.body.id}/disable`)
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/staff/${cashier.body.id}/enable`)
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post("/staff")
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .send({
        name: "Wrong tenant",
        email: `wrong-${suffix}@example.test`,
        password,
        role: "cashier",
        branchIds: [second.body.branchId],
      })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/staff/${second.body.ownerId}/disable`)
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .expect(404);
    const audit = await dataSource.query(
      "SELECT actor_id, business_id, action, target_id, result FROM audit_logs WHERE business_id = ? AND target_id = ?",
      [first.body.businessId, second.body.ownerId],
    );
    expect(audit).toContainEqual(
      expect.objectContaining({
        actor_id: first.body.ownerId,
        business_id: first.body.businessId,
        action: "staff.disable",
        target_id: second.body.ownerId,
        result: "failure",
      }),
    );
    await request(app.getHttpServer())
      .patch(`/staff/${first.body.ownerId}/disable`)
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .expect(400);

    const cashierLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: cashierEmail, password })
      .expect(200);
    await request(app.getHttpServer())
      .post("/staff")
      .set("Authorization", `Bearer ${cashierLogin.body.accessToken}`)
      .send({
        name: "Nope",
        email: `nope-${suffix}@example.test`,
        password,
        role: "cashier",
      })
      .expect(403);
    const logout = await request(app.getHttpServer())
      .post("/auth/logout")
      .set("Cookie", rotated.headers["set-cookie"])
      .expect(204);
    expect(logout.headers["set-cookie"][0]).toMatch(
      /pc_refresh=; HttpOnly; SameSite=Lax; Path=\/points-card-api\/auth/,
    );
  });
});
