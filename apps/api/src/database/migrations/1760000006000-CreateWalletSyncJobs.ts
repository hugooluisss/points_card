import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletSyncJobs1760000006000 implements MigrationInterface {
  name = "CreateWalletSyncJobs1760000006000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE wallet_sync_jobs (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, account_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
      status ENUM('pending','processing','done','failed') NOT NULL DEFAULT 'pending', attempts INT NOT NULL DEFAULT 0,
      next_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, last_error TEXT NULL,
      locked_at TIMESTAMP NULL,
      pending_account_id CHAR(36) NULL,
      pending_job_key CHAR(36) GENERATED ALWAYS AS (IF(status = 'pending', pending_account_id, NULL)) STORED,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_wallet_sync_pending_account (pending_job_key),
      KEY ix_wallet_sync_due (status, next_attempt_at),
      CONSTRAINT fk_wallet_sync_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_wallet_sync_account FOREIGN KEY (account_id) REFERENCES loyalty_accounts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE wallet_sync_jobs");
  }
}
