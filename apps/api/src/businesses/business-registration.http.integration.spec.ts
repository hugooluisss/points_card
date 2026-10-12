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
import { Business } from "./entities/business.entity";

describe("POST /businesses/register", () => {
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
      const staff = await dataSource.query(
        "SELECT business_id FROM staff_users WHERE email = ?",
        [email],
      );
      if (staff.length)
        await dataSource.getRepository(Business).delete(staff[0].business_id);
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it("registers with ids only, validates Spanish messages, and rejects duplicate emails generically", async () => {
    const email = `http-registration-${Date.now()}-${Math.random()}@example.test`;
    emails.push(email);
    const valid = {
      businessName: "HTTP Shop",
      ownerName: "Owner Example",
      email,
      password: "secure-password",
    };
    const success = await request(app.getHttpServer())
      .post("/businesses/register")
      .send(valid)
      .expect(201);
    expect(success.body).toEqual(
      expect.objectContaining({
        businessId: expect.any(String),
        branchId: expect.any(String),
        ownerId: expect.any(String),
      }),
    );
    expect(JSON.stringify(success.body)).not.toMatch(/password/i);

    const invalid = await request(app.getHttpServer())
      .post("/businesses/register")
      .send({ ...valid, email: "invalid-email", password: "short" })
      .expect(400);
    expect(invalid.body.message).toEqual(
      expect.arrayContaining([
        "Ingresa un correo electrónico válido.",
        "La contraseña debe tener al menos 8 caracteres.",
      ]),
    );

    const duplicate = await request(app.getHttpServer())
      .post("/businesses/register")
      .send(valid)
      .expect(409);
    expect(duplicate.body.message).toBe(
      "No fue posible registrar el comercio con esos datos.",
    );
    expect(JSON.stringify(duplicate.body)).not.toMatch(
      /owner example|business_id|account/i,
    );
  });
});
