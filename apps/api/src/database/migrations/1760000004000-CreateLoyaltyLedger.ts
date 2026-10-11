import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLoyaltyLedger1760000004000 implements MigrationInterface {
  name = "CreateLoyaltyLedger1760000004000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE loyalty_accounts (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, program_id CHAR(36) NOT NULL,
      card_code VARCHAR(64) NOT NULL, customer_id CHAR(36) NULL, balance INT NOT NULL DEFAULT 0,
      status ENUM('active','disabled') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_loyalty_accounts_card_code (card_code), KEY ix_loyalty_accounts_business_program (business_id, program_id),
      CONSTRAINT chk_loyalty_accounts_balance CHECK (balance >= 0),
      CONSTRAINT fk_loyalty_accounts_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_loyalty_accounts_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE loyalty_transactions (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, branch_id CHAR(36) NOT NULL,
      account_id CHAR(36) NOT NULL, program_id CHAR(36) NOT NULL,
      type ENUM('accumulate','redeem','adjust','reverse') NOT NULL, amount INT NOT NULL,
      purchase_amount DECIMAL(12,2) NULL, reward_id CHAR(36) NULL, reference VARCHAR(255) NULL,
      reason VARCHAR(255) NULL, reverses_transaction_id CHAR(36) NULL, actor_id CHAR(36) NOT NULL,
      idempotency_key VARCHAR(100) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_loyalty_transactions_business_idempotency (business_id, idempotency_key),
      KEY ix_loyalty_transactions_account (business_id, account_id),
      CONSTRAINT fk_loyalty_transactions_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_loyalty_transactions_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
      CONSTRAINT fk_loyalty_transactions_account FOREIGN KEY (account_id) REFERENCES loyalty_accounts(id),
      CONSTRAINT fk_loyalty_transactions_program FOREIGN KEY (program_id) REFERENCES programs(id),
      CONSTRAINT fk_loyalty_transactions_reward FOREIGN KEY (reward_id) REFERENCES rewards(id),
      CONSTRAINT fk_loyalty_transactions_reversal FOREIGN KEY (reverses_transaction_id) REFERENCES loyalty_transactions(id),
      CONSTRAINT fk_loyalty_transactions_actor FOREIGN KEY (actor_id) REFERENCES staff_users(id)
    )`);
    await queryRunner.query(`CREATE TABLE redemptions (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, account_id CHAR(36) NOT NULL,
      reward_id CHAR(36) NOT NULL, transaction_id CHAR(36) NOT NULL,
      status ENUM('completed','reversed') NOT NULL DEFAULT 'completed',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_redemptions_transaction (transaction_id),
      CONSTRAINT fk_redemptions_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_redemptions_account FOREIGN KEY (account_id) REFERENCES loyalty_accounts(id),
      CONSTRAINT fk_redemptions_reward FOREIGN KEY (reward_id) REFERENCES rewards(id),
      CONSTRAINT fk_redemptions_transaction FOREIGN KEY (transaction_id) REFERENCES loyalty_transactions(id)
    )`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE redemptions");
    await queryRunner.query("DROP TABLE loyalty_transactions");
    await queryRunner.query("DROP TABLE loyalty_accounts");
  }
}
