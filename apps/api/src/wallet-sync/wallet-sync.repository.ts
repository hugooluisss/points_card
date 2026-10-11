import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { EntityManager, Repository } from "typeorm";
import { TenantContext } from "../tenancy/tenant-context.service";
import { BaseTenantRepository } from "../tenancy/base-tenant.repository";
import { WalletSyncJob } from "./entities/wallet-sync-job.entity";

@Injectable()
export class WalletSyncRepository extends BaseTenantRepository<WalletSyncJob> {
  constructor(
    @InjectRepository(WalletSyncJob)
    private readonly jobs: Repository<WalletSyncJob>,
    tenant: TenantContext,
  ) {
    super(jobs, tenant);
  }
  async enqueueForAccount(
    manager: EntityManager,
    businessId: string,
    accountId: string,
  ): Promise<void> {
    await manager.query(
      `INSERT INTO wallet_sync_jobs (id, business_id, account_id, pending_account_id, status, attempts, next_attempt_at)
      VALUES (?, ?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE id = id`,
      [randomUUID(), businessId, accountId, accountId],
    );
  }
  async failed() {
    return this.find({
      where: { status: "failed" },
      order: { createdAt: "ASC" },
    });
  }
  async retry(id: string) {
    const job = await this.findOneBy({ id, status: "failed" });
    if (!job) return null;
    await this.update(
      { id, status: "failed" },
      {
        status: "pending",
        pendingAccountId: job.accountId,
        lockedAt: null,
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
      },
    );
    return this.findOneBy({ id });
  }
}
