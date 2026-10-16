import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes, randomUUID } from "node:crypto";
import { DataSource, Repository } from "typeorm";
import { Business } from "../businesses/entities/business.entity";
import { Customer } from "../customers/entities/customer.entity";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { PrivacyNotice } from "../privacy/entities/privacy-notice.entity";
import { Consent } from "../consents/entities/consent.entity";
import { CardRecoveryToken } from "../wallet-pass/entities/card-recovery-token.entity";
import { DEFAULT_PRIVACY_NOTICE } from "../privacy/default-privacy-notice";
import { WalletPass } from "../wallet-sync/entities/wallet-pass.entity";
import { TenantContext } from "../tenancy/tenant-context.service";
import { UpdateRegistrationSettingsDto } from "./dto/update-registration-settings.dto";
import { Clock } from "../ledger/clock";
import { cardState } from "../ledger/card-state";

@Injectable()
// Allow-listed: public lookups use public_code; authenticated business writes explicitly scope by tenant ID.
export class RegistrationRepository {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(LoyaltyProgram)
    private readonly programs: Repository<LoyaltyProgram>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(LoyaltyAccount)
    private readonly accounts: Repository<LoyaltyAccount>,
    @InjectRepository(PrivacyNotice)
    private readonly notices: Repository<PrivacyNotice>,
    @InjectRepository(Consent) private readonly consents: Repository<Consent>,
    @InjectRepository(WalletPass)
    private readonly passes: Repository<WalletPass>,
    @InjectRepository(CardRecoveryToken)
    private readonly recoveryTokens: Repository<CardRecoveryToken>,
    private readonly source: DataSource,
    private readonly tenant: TenantContext,
    private readonly clock: Clock,
  ) {}
  get businessId() {
    return this.tenant.getBusinessId();
  }
  byId(id: string) {
    return this.businesses.findOneBy({ id });
  }
  settings() {
    return this.businesses.findOneBy({ id: this.businessId });
  }
  async updateSettings(input: UpdateRegistrationSettingsDto) {
    const business = await this.settings();
    if (!business) return null;
    await this.businesses.update(
      { id: business.id },
      {
        registrationFields: input.fields,
        brandColor: input.brandColor ?? null,
        logoUrl: input.logoUrl ?? null,
      },
    );
    return this.settings();
  }
  byPublicCode(publicCode: string) {
    return this.businesses.findOneBy({ publicCode });
  }
  activePrograms(businessId: string) {
    return this.programs.findBy({ businessId, status: "active" });
  }
  async customerByContact(
    businessId: string,
    email: string | null,
    phone: string | null,
  ): Promise<Customer | null> {
    if (!email && !phone) return Promise.resolve(null);
    const rows = await this.source.query(
      `SELECT * FROM customers WHERE business_id = ? AND (${[
        email ? "LOWER(TRIM(email)) = ?" : "",
        phone ? "REGEXP_REPLACE(phone, '[^0-9]', '') = ?" : "",
      ]
        .filter(Boolean)
        .join(" OR ")}) LIMIT 1`,
      [
        businessId,
        ...(email ? [email.trim().toLowerCase()] : []),
        ...(phone ? [phone.replace(/\D/g, "")] : []),
      ],
    );
    return rows[0] ? (rows[0] as Customer) : null;
  }
  async currentNotice(businessId: string) {
    const notice = await this.notices.findOne({
      where: { businessId },
      order: { version: "DESC" },
    });
    if (notice) return notice;
    try {
      return await this.source.getRepository(PrivacyNotice).save({
        id: randomUUID(),
        businessId,
        version: 1,
        text: DEFAULT_PRIVACY_NOTICE,
      });
    } catch (error) {
      if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
      return this.notices.findOneByOrFail({ businessId, version: 1 });
    }
  }
  async registerWithPasses(input: {
    businessId: string;
    name: string;
    email: string | null;
    phone: string | null;
    birthday: string | null;
    noticeVersion: number;
    marketing: boolean;
    programIds: string[];
    manageTokenHash: string | null;
  }) {
    return this.source.transaction(async (manager) => {
      const customer = await manager.getRepository(Customer).save({
        id: randomUUID(),
        businessId: input.businessId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        birthday: input.birthday,
        status: "active",
      });
      const accounts = await manager.getRepository(LoyaltyAccount).save(
        input.programIds.map((programId) => ({
          id: randomUUID(),
          businessId: input.businessId,
          programId,
          cardCode: randomBytes(18).toString("base64url"),
          customerId: customer.id,
          balance: 0,
          status: "active" as const,
        })),
      );
      const rows: Partial<Consent>[] = [
        {
          id: randomUUID(),
          businessId: input.businessId,
          customerId: customer.id,
          purpose: "privacy_notice",
          channel: "all",
          noticeVersion: input.noticeVersion,
          status: "granted",
          origin: "registration",
        },
      ];
      if (input.marketing)
        rows.push({
          id: randomUUID(),
          businessId: input.businessId,
          customerId: customer.id,
          purpose: "marketing",
          channel: "all",
          status: "granted",
          origin: "registration",
        });
      await manager.getRepository(Consent).save(rows);
      if (input.manageTokenHash)
        await manager.getRepository(CardRecoveryToken).save({
          id: randomUUID(),
          businessId: input.businessId,
          customerId: customer.id,
          tokenHash: input.manageTokenHash,
          expiresAt: new Date(
            this.clock.now().getTime() + 10 * 365 * 86_400_000,
          ),
          usedAt: null,
        });
      for (const account of accounts)
        for (const platform of ["google", "apple"] as const)
          await manager.getRepository(WalletPass).save({
            id: randomUUID(),
            businessId: input.businessId,
            accountId: account.id,
            platform,
            externalRef: `https://${platform}.wallet.example/save/${account.cardCode}`,
            status: "issued",
          });
      return { customer, accounts };
    });
  }
  async disablePasses(businessId: string, accountId: string) {
    await this.passes.update(
      { businessId, accountId, status: "issued" },
      { status: "disabled" },
    );
  }
  async reissue(businessId: string, id: string, cardCode: string) {
    await this.source.transaction(async (manager) => {
      await manager
        .getRepository(LoyaltyAccount)
        .update({ id, businessId }, { cardCode });
      await manager
        .getRepository(WalletPass)
        .update(
          { businessId, accountId: id, status: "issued" },
          { status: "disabled" },
        );
      for (const platform of ["google", "apple"] as const)
        await manager.getRepository(WalletPass).save({
          id: randomUUID(),
          businessId,
          accountId: id,
          platform,
          externalRef: `https://${platform}.wallet.example/save/${cardCode}`,
          status: "issued",
        });
    });
  }
  createRecoveryToken(input: Partial<CardRecoveryToken>) {
    return this.recoveryTokens.save(this.recoveryTokens.create(input));
  }
  async revokeMarketingByToken(tokenHash: string) {
    const now = this.clock.now();
    return this.source.transaction(async (manager) => {
      const tokens = manager.getRepository(CardRecoveryToken);
      const token = await tokens.findOneBy({ tokenHash });
      if (!token || token.usedAt || token.expiresAt <= now) return false;
      const result = await tokens
        .createQueryBuilder()
        .update()
        .set({ usedAt: now })
        .where("id = :id AND used_at IS NULL AND expires_at > :now", {
          id: token.id,
          now,
        })
        .execute();
      if (!result.affected) return false;
      await manager.getRepository(Consent).save({
        businessId: token.businessId,
        customerId: token.customerId,
        purpose: "marketing",
        channel: "all",
        noticeVersion: null,
        status: "revoked",
        origin: "recovery_link",
        createdAt: now,
      });
      return true;
    });
  }
  async consumeRecoveryToken(tokenHash: string, now: Date) {
    const token = await this.recoveryTokens.findOneBy({ tokenHash });
    if (!token || token.usedAt || token.expiresAt <= now) return null;
    const result = await this.recoveryTokens
      .createQueryBuilder()
      .update()
      .set({ usedAt: now })
      .where("id = :id AND used_at IS NULL AND expires_at > :now", {
        id: token.id,
        now,
      })
      .execute();
    if (!result.affected) return null;
    return this.customers.findOneBy({
      id: token.customerId,
      businessId: token.businessId,
    });
  }
  byIdForTenant(id: string) {
    return this.accounts.findOneBy({ id, businessId: this.businessId });
  }
  disableAccount(businessId: string, id: string) {
    return this.accounts.update({ id, businessId }, { status: "disabled" });
  }
  async activeCustomerAccounts(businessId: string, customerId: string) {
    return this.accounts.findBy({ businessId, customerId, status: "active" });
  }
  async walletPassDetails(businessId: string, accountId: string) {
    const account = await this.accounts.findOneByOrFail({
      id: accountId,
      businessId,
    });
    const program = await this.programs.findOneByOrFail({
      id: account.programId,
      businessId,
    });
    const rewards: Array<{ cost: number }> = await this.source.query(
      "SELECT cost FROM rewards WHERE business_id = ? AND program_id = ? AND is_active = 1",
      [businessId, program.id],
    );
    const goal = program.mode === "stamps" ? program.stampsGoal : null;
    const state = cardState(
      program.mode,
      account.balance,
      goal,
      rewards.map(({ cost }) => Number(cost)),
    );
    return {
      mode: program.mode,
      balance: account.balance,
      ...state,
    };
  }
}
