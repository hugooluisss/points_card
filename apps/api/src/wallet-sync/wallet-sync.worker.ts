import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyProgram } from "../loyalty/entities/loyalty-program.entity";
import { WalletSyncJob } from "./entities/wallet-sync-job.entity";
import { WALLET_PROVIDER, WalletProvider } from "./wallet-provider";
import { cardState } from "../ledger/card-state";

const delays = [30_000, 120_000, 600_000, 1_800_000, 7_200_000];
@Injectable()
export class WalletSyncWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WalletSyncWorker.name);
  private timer?: NodeJS.Timeout;
  constructor(
    private readonly dataSource: DataSource,
    @Inject(WALLET_PROVIDER) private readonly provider: WalletProvider,
  ) {}
  onModuleInit() {
    if (
      process.env.NODE_ENV === "test" &&
      process.env.WALLET_SYNC_ENABLED !== "true"
    )
      return;
    const interval = Math.max(
      1,
      Number(process.env.WALLET_SYNC_INTERVAL_MS) || 5000,
    );
    this.timer = setInterval(() => void this.runDueJobs(), interval);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async runDueJobs(): Promise<void> {
    const leaseSeconds = Math.max(
      1,
      Number(process.env.WALLET_SYNC_LEASE_SECONDS) || 300,
    );
    const retentionDays = Math.max(
      1,
      Number(process.env.WALLET_SYNC_RETENTION_DAYS) || 7,
    );
    await this.dataSource.query(
      `UPDATE wallet_sync_jobs SET status = 'pending', attempts = attempts + 1,
      pending_account_id = account_id, locked_at = NULL,
      last_error = 'Processing lease expired; job recovered by worker'
      WHERE status = 'processing' AND locked_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? SECOND)`,
      [leaseSeconds],
    );
    await this.dataSource.query(
      `DELETE FROM wallet_sync_jobs WHERE status = 'done'
      AND updated_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? DAY) LIMIT 500`,
      [retentionDays],
    );
    const ids: string[] = await this.dataSource.transaction(async (manager) => {
      const rows: Array<{ id: string }> = await manager.query(
        "SELECT id FROM wallet_sync_jobs WHERE status = 'pending' AND next_attempt_at <= CURRENT_TIMESTAMP ORDER BY created_at LIMIT 20 FOR UPDATE SKIP LOCKED",
      );
      for (const row of rows)
        await manager
          .getRepository(WalletSyncJob)
          .update(row.id, { status: "processing", lockedAt: new Date() });
      return rows.map((row) => row.id);
    });
    for (const id of ids) await this.process(id);
  }
  private async process(id: string) {
    const job = await this.dataSource
      .getRepository(WalletSyncJob)
      .findOneBy({ id, status: "processing" });
    if (!job) return;
    let providerSettled = false;
    try {
      const rows = await this.dataSource.query(
        `SELECT a.card_code AS cardCode, a.balance, p.mode, p.stamps_goal AS goal,
        (SELECT GROUP_CONCAT(r.cost) FROM rewards r WHERE r.business_id = a.business_id AND r.program_id = p.id AND r.is_active = 1) AS rewardCosts
        FROM loyalty_accounts a JOIN programs p ON p.id = a.program_id AND p.business_id = a.business_id
        WHERE a.id = ? AND a.business_id = ?`,
        [job.accountId, job.businessId],
      );
      if (!rows[0]) throw new Error("Loyalty account no longer exists");
      const current = rows[0];
      let timeout: NodeJS.Timeout;
      const balance = Number(current.balance);
      const goal = current.goal === null ? null : Number(current.goal);
      const rewardCosts = current.rewardCosts
        ? String(current.rewardCosts).split(",").map(Number)
        : [];
      await Promise.race([
        this.provider
          .updatePass({
            cardCode: current.cardCode,
            mode: current.mode,
            balance,
            ...cardState(current.mode, balance, goal, rewardCosts),
          })
          .then(() => {
            providerSettled = true;
          }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("Wallet provider timed out")),
            Math.max(
              1,
              Number(process.env.WALLET_SYNC_PROVIDER_TIMEOUT_MS) || 10000,
            ),
          );
        }),
      ]).finally(() => clearTimeout(timeout!));
      if (!providerSettled) return;
      await this.dataSource
        .getRepository(WalletSyncJob)
        .update(
          { id, status: "processing" },
          {
            status: "done",
            pendingAccountId: null,
            lockedAt: null,
            lastError: null,
          },
        );
    } catch (error) {
      const attempts = job.attempts + 1;
      if (
        String((error as Error)?.message ?? error) ===
        "Wallet provider timed out"
      )
        providerSettled = false;
      await this.dataSource.getRepository(WalletSyncJob).update(
        { id, status: "processing" },
        {
          attempts,
          status: attempts >= 6 ? "failed" : "pending",
          pendingAccountId: attempts >= 6 ? null : job.accountId,
          lockedAt: null,
          nextAttemptAt: new Date(
            Date.now() + delays[Math.min(attempts - 1, delays.length - 1)],
          ),
          lastError: String((error as Error)?.message ?? error).slice(0, 65535),
        },
      );
      this.logger.error(`Wallet sync ${id} failed after attempt ${attempts}`);
    }
  }
}
