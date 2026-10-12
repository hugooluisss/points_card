import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { databaseOptions } from "../database/database.options";
import { TenantContext } from "../tenancy/tenant-context.service";
import { Business } from "../businesses/entities/business.entity";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyTransaction } from "../ledger/entities/loyalty-transaction.entity";
import { Customer } from "./entities/customer.entity";
import { CustomersRepository } from "./customers.repository";
import { CustomersService } from "./customers.service";
import { Consent } from "../consents/entities/consent.entity";
import { ConsentsRepository } from "../consents/consents.repository";
import { ConsentsService } from "../consents/consents.service";
import { PrivacyNoticesRepository } from "../privacy/privacy-notices.repository";
import { PrivacyNotice } from "../privacy/entities/privacy-notice.entity";
import { Branch } from "../branches/entities/branch.entity";
import { BusinessRepository } from "../businesses/business.repository";
import { StaffUser } from "../staff/entities/staff-user.entity";
import { Clock } from "../ledger/clock";

config();

describe("customer privacy database behavior", () => {
  let source: DataSource;
  let tenant: TenantContext;
  let customerRepo: CustomersRepository;
  let consentRepo: ConsentsRepository;
  let consentService: ConsentsService;
  let customerService: CustomersService;
  const businessIds: string[] = [];

  beforeAll(async () => {
    source = new DataSource(
      databaseOptions(
        new ConfigService({ ...process.env, NODE_ENV: "test" }),
        process.env.DB_DATABASE_TEST!,
      ),
    );
    await source.initialize();
    await source.runMigrations();
    tenant = new TenantContext();
    customerRepo = new CustomersRepository(
      source.getRepository(Customer),
      source.getRepository(LoyaltyAccount),
      source.getRepository(LoyaltyTransaction),
      tenant,
    );
    consentRepo = new ConsentsRepository(source.getRepository(Consent), tenant);
    consentService = new ConsentsService(consentRepo);
    customerService = new CustomersService(customerRepo, consentService);
  });

  afterEach(async () => {
    for (const businessId of businessIds.splice(0)) {
      await source.query(
        "DELETE FROM loyalty_transactions WHERE business_id = ?",
        [businessId],
      );
      await source.query("DELETE FROM loyalty_accounts WHERE business_id = ?", [
        businessId,
      ]);
      await source.getRepository(Business).delete({ id: businessId });
    }
  });

  afterAll(async () => source.destroy());

  it("enforces per-business normalized-contact uniqueness and appends consent evidence", async () => {
    const businessResult = await new BusinessRepository(
      source.getRepository(Business),
      source.getRepository(Branch),
      source.getRepository(StaffUser),
      source,
      new Clock(),
    ).register({
      businessName: "Privacy",
      branchName: "Privacy",
      ownerName: "Owner",
      email: `owner-${Date.now()}@example.test`,
      passwordHash: "hash",
    });
    businessIds.push(businessResult.businessId);
    await tenant.run({ businessId: businessResult.businessId }, async () => {
      const first = await customerRepo.createCustomer({
        name: "Ana",
        email: " ANA@example.test ",
        phone: "+52 (55) 1234-5678",
      });
      await expect(
        customerRepo.createCustomer({
          name: "Duplicate",
          email: "ana@example.test",
        }),
      ).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
      await expect(
        customerRepo.createCustomer({
          name: "Duplicate phone",
          phone: "525512345678",
        }),
      ).rejects.toMatchObject({ code: "ER_DUP_ENTRY" });
      await consentService.record({
        customerId: first.id,
        purpose: "marketing",
        channel: "email",
        status: "granted",
        origin: "registration",
      });
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await consentService.record({
        customerId: first.id,
        purpose: "marketing",
        channel: "email",
        status: "revoked",
        origin: "arco",
      });
      expect(await consentService.isMarketingActive(first.id, "email")).toBe(
        false,
      );
      expect(await consentService.history(first.id)).toHaveLength(2);
      const [consentCount] = await source.query(
        "SELECT COUNT(*) AS n FROM consents WHERE customer_id = ?",
        [first.id],
      );
      expect(Number(consentCount.n)).toBe(2);
    });
  });

  it("versions notices and scopes exports, anonymization, and ledger preservation", async () => {
    const businesses = new BusinessRepository(
      source.getRepository(Business),
      source.getRepository(Branch),
      source.getRepository(StaffUser),
      source,
      new Clock(),
    );
    const businessA = await businesses.register({
      businessName: "A",
      branchName: "A",
      ownerName: "Owner A",
      email: `owner-a-${Date.now()}@example.test`,
      passwordHash: "hash",
    });
    const businessB = await businesses.register({
      businessName: "B",
      branchName: "B",
      ownerName: "Owner B",
      email: `owner-b-${Date.now()}@example.test`,
      passwordHash: "hash",
    });
    businessIds.push(businessA.businessId, businessB.businessId);
    const branch = await source
      .getRepository(Branch)
      .findOneByOrFail({ businessId: businessA.businessId });
    const actor = await source
      .getRepository(StaffUser)
      .findOneByOrFail({ businessId: businessA.businessId });
    const programs = source.getRepository(LoyaltyProgram);
    const programA = await programs.save({
      businessId: businessA.businessId,
      name: "Program A",
      mode: "stamps",
      status: "active",
      validFrom: "2026-01-01",
      stampsGoal: 10,
    });
    let customerId = "";
    await tenant.run({ businessId: businessA.businessId }, async () => {
      const notices = new PrivacyNoticesRepository(
        source.getRepository(PrivacyNotice),
        tenant,
      );
      expect(
        await notices.createVersion(
          "Aviso inicial con más de cincuenta caracteres para prueba de versión.",
        ),
      ).toMatchObject({ version: 1 });
      expect(
        await notices.createVersion(
          "Aviso actualizado con más de cincuenta caracteres para prueba de versión.",
        ),
      ).toMatchObject({ version: 2 });
      const customer = await customerRepo.createCustomer({
        name: "Ana",
        email: "ana@example.test",
        birthday: "1990-01-01",
      });
      customerId = customer.id;
      const account = await source.getRepository(LoyaltyAccount).save({
        businessId: businessA.businessId,
        programId: programA.id,
        cardCode: `card-${Date.now()}`,
        customerId,
        balance: 7,
        status: "active",
      });
      await source.getRepository(LoyaltyTransaction).save({
        businessId: businessA.businessId,
        branchId: branch.id,
        accountId: account.id,
        programId: programA.id,
        type: "adjust",
        amount: 7,
        purchaseAmount: null,
        rewardId: null,
        reference: null,
        reason: "fixture",
        reversesTransactionId: null,
        actorId: actor.id,
        idempotencyKey: `privacy-${Date.now()}`,
      });
      const exported = await customerService.exportData(customerId);
      expect(exported.accounts).toHaveLength(1);
      expect(exported.movements).toHaveLength(1);
      await expect(
        tenant.run({ businessId: businessB.businessId }, () =>
          customerService.exportData(customerId),
        ),
      ).rejects.toMatchObject({ status: 404 });
      expect(await customerService.anonymize(customerId)).toEqual({
        anonymized: true,
      });
      expect(await customerService.anonymize(customerId)).toEqual({
        anonymized: false,
      });
      expect(
        await source
          .getRepository(LoyaltyTransaction)
          .countBy({ accountId: account.id }),
      ).toBe(1);
      expect(
        await source
          .getRepository(LoyaltyAccount)
          .findOneByOrFail({ id: account.id }),
      ).toMatchObject({ status: "disabled", balance: 7 });
      expect(
        await source
          .getRepository(Customer)
          .findOneByOrFail({ id: customerId }),
      ).toMatchObject({
        name: "Cliente anonimizado",
        email: null,
        phone: null,
        birthday: null,
        status: "anonymized",
      });
    });
  });
});
