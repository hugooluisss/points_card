// Allow-listed: the transactional unit of work applies business_id to every query and locked row.
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes, randomUUID } from "node:crypto";
import { DataSource, EntityManager, Repository } from "typeorm";
import { TenantContext } from "../tenancy/tenant-context.service";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { LoyaltyReward } from "../loyalty/entities/loyalty-reward.entity";
import { LoyaltyAccount } from "./entities/loyalty-account.entity";
import { LoyaltyTransaction } from "./entities/loyalty-transaction.entity";
import { Redemption } from "./entities/redemption.entity";
import { Branch } from "../branches/entities/branch.entity";
import { businessDayBounds } from "./business-day";
import { WalletSyncRepository } from "../wallet-sync/wallet-sync.repository";
import { IdempotencyExpectation, assertIdempotencyReplay } from "./idempotency";
import { Clock } from "./clock";

@Injectable()
export class LedgerRepository {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly accounts: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyProgram)
    private readonly programs: Repository<LoyaltyProgram>,
    @InjectRepository(LoyaltyReward)
    private readonly rewards: Repository<LoyaltyReward>,
    @InjectRepository(Branch) private readonly branches: Repository<Branch>,
    private readonly dataSource: DataSource,
    private readonly tenant: TenantContext,
    private readonly walletSync: WalletSyncRepository,
    private readonly clock: Clock,
  ) {}
  private get businessId() {
    return this.tenant.getBusinessId();
  }
  async program(id: string) {
    return this.programs.findOneBy({ id, businessId: this.businessId });
  }
  async accountByCode(cardCode: string) {
    return this.accounts.findOneBy({
      cardCode,
      businessId: this.businessId,
    });
  }
  async reward(id: string, programId: string) {
    return this.rewards.findOneBy({
      id,
      programId,
      businessId: this.businessId,
      isActive: true,
    });
  }
  async activeRewards(programId: string) {
    return this.rewards.findBy({
      programId,
      businessId: this.businessId,
      isActive: true,
    });
  }
  async defaultBranchId() {
    return (
      await this.branches.findOneBy({
        businessId: this.businessId,
        isDefault: true,
      })
    )?.id;
  }
  async hasBranch(id: string) {
    return this.branches.existsBy({ id, businessId: this.businessId });
  }
  async createAccount(programId: string) {
    if (!(await this.program(programId))) return null;
    const cardCode = randomBytes(18).toString("base64url");
    return this.accounts.save(
      this.accounts.create({
        businessId: this.businessId,
        programId,
        cardCode,
        balance: 0,
        customerId: null,
        status: "active",
      }),
    );
  }
  async idempotent<T extends { transaction: LoyaltyTransaction }>(
    key: string,
    expected: IdempotencyExpectation,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const execute = async (manager: EntityManager): Promise<T> => {
      await manager.query("SET time_zone = '+00:00'");
      const previous = await this.transactionByKey(manager, key);
      if (!previous) return work(manager);
      const account = await manager
        .getRepository(LoyaltyAccount)
        .findOneBy({ id: previous.accountId, businessId: this.businessId });
      assertIdempotencyReplay(previous, account?.cardCode ?? null, expected);
      return { transaction: previous } as T;
    };
    try {
      return await this.dataSource.transaction(execute);
    } catch (error) {
      if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
      return this.dataSource.transaction(async (manager) => {
        const previous = await this.transactionByKey(manager, key);
        if (!previous) throw error;
        const account = await manager
          .getRepository(LoyaltyAccount)
          .findOneBy({ id: previous.accountId, businessId: this.businessId });
        assertIdempotencyReplay(previous, account?.cardCode ?? null, expected);
        return { transaction: previous } as T;
      });
    }
  }
  async lockedAccount(manager: EntityManager, id: string) {
    const rows = await manager.query(
      "SELECT * FROM loyalty_accounts WHERE id = ? AND business_id = ? FOR UPDATE",
      [id, this.businessId],
    );
    return rows[0]
      ? (manager
          .getRepository(LoyaltyAccount)
          .create(rows[0]) as unknown as LoyaltyAccount)
      : null;
  }
  async accountForUpdate(manager: EntityManager, cardCode: string) {
    const rows = await manager.query(
      "SELECT * FROM loyalty_accounts WHERE card_code = ? AND business_id = ? FOR UPDATE",
      [cardCode, this.businessId],
    );
    return rows[0]
      ? (manager
          .getRepository(LoyaltyAccount)
          .create(rows[0]) as unknown as LoyaltyAccount)
      : null;
  }
  async transactionByKey(manager: EntityManager, key: string) {
    return manager
      .getRepository(LoyaltyTransaction)
      .findOneBy({ businessId: this.businessId, idempotencyKey: key });
  }
  async transaction(manager: EntityManager, id: string) {
    return manager
      .getRepository(LoyaltyTransaction)
      .findOneBy({ id, businessId: this.businessId });
  }
  async reversed(manager: EntityManager, id: string) {
    return manager
      .getRepository(LoyaltyTransaction)
      .existsBy({ businessId: this.businessId, reversesTransactionId: id });
  }
  async fraudCounts(
    manager: EntityManager,
    accountId: string,
    actorId: string,
    since: Date,
    until: Date,
  ) {
    const rows = await manager.query(
      `SELECT
      (SELECT COUNT(*) FROM loyalty_transactions WHERE business_id = ? AND account_id = ? AND type = 'accumulate' AND UNIX_TIMESTAMP(created_at) >= ? AND UNIX_TIMESTAMP(created_at) < ?) AS card_count,
      (SELECT COUNT(*) FROM loyalty_transactions WHERE business_id = ? AND actor_id = ? AND type = 'accumulate' AND UNIX_TIMESTAMP(created_at) >= ? AND UNIX_TIMESTAMP(created_at) < ?) AS staff_count,
      (SELECT MAX(UNIX_TIMESTAMP(t.created_at) * 1000) FROM loyalty_transactions t WHERE t.business_id = ? AND t.account_id = ? AND t.type = 'accumulate' AND NOT EXISTS (SELECT 1 FROM loyalty_transactions r WHERE r.reverses_transaction_id = t.id)) AS last_card_accumulation`,
      [
        this.businessId,
        accountId,
        Math.floor(since.getTime() / 1000),
        Math.floor(until.getTime() / 1000),
        this.businessId,
        actorId,
        Math.floor(since.getTime() / 1000),
        Math.floor(until.getTime() / 1000),
        this.businessId,
        accountId,
      ],
    );
    return {
      cardCount: Number(rows[0].card_count ?? 0),
      staffCount: Number(rows[0].staff_count ?? 0),
      lastAccumulation: rows[0].last_card_accumulation
        ? Number(rows[0].last_card_accumulation)
        : null,
    };
  }
  async staffAnomalies(date: string, timezone: string) {
    const [start, end] = businessDayBounds(date, timezone);
    return this.dataSource.query(
      `SELECT t.actor_id AS staffUserId, s.name AS staffName, t.program_id AS programId,
      COUNT(*) AS count, p.staff_daily_alert_threshold AS threshold
      FROM loyalty_transactions t JOIN programs p ON p.id = t.program_id AND p.business_id = t.business_id
      JOIN staff_users s ON s.id = t.actor_id AND s.business_id = t.business_id
      WHERE t.business_id = ? AND t.type = 'accumulate' AND t.created_at >= ? AND t.created_at < ? AND p.staff_daily_alert_threshold IS NOT NULL
      GROUP BY t.actor_id, s.name, t.program_id, p.staff_daily_alert_threshold
      HAVING COUNT(*) > p.staff_daily_alert_threshold`,
      [this.businessId, start, end],
    );
  }
  dayBounds(date: string, timezone: string) {
    return businessDayBounds(date, timezone);
  }
  async insertTransaction(
    manager: EntityManager,
    input: Partial<LoyaltyTransaction>,
  ) {
    const repo = manager.getRepository(LoyaltyTransaction);
    const createdAt = this.clock.now();
    const transaction = await repo.save(
      repo.create({
        ...input,
        id: randomUUID(),
        businessId: this.businessId,
        createdAt,
      }),
    );
    await manager.query(
      "UPDATE loyalty_transactions SET created_at = FROM_UNIXTIME(?) WHERE id = ? AND business_id = ?",
      [Math.floor(createdAt.getTime() / 1000), transaction.id, this.businessId],
    );
    return transaction;
  }
  async saveAccount(
    manager: EntityManager,
    account: LoyaltyAccount,
    balance: number,
  ) {
    await manager
      .getRepository(LoyaltyAccount)
      .update({ id: account.id, businessId: this.businessId }, { balance });
    await this.walletSync.enqueueForAccount(
      manager,
      this.businessId,
      account.id,
    );
  }
  async insertRedemption(manager: EntityManager, input: Partial<Redemption>) {
    const repo = manager.getRepository(Redemption);
    const createdAt = this.clock.now();
    const redemption = await repo.save(
      repo.create({
        ...input,
        id: randomUUID(),
        businessId: this.businessId,
        createdAt,
      }),
    );
    await manager.query(
      "UPDATE redemptions SET created_at = FROM_UNIXTIME(?) WHERE id = ? AND business_id = ?",
      [Math.floor(createdAt.getTime() / 1000), redemption.id, this.businessId],
    );
    return redemption;
  }
  async markRedemptionReversed(manager: EntityManager, transactionId: string) {
    await manager
      .getRepository(Redemption)
      .update(
        { transactionId, businessId: this.businessId },
        { status: "reversed" },
      );
  }
}
