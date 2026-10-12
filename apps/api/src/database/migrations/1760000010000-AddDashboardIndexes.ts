import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDashboardIndexes1760000010000 implements MigrationInterface {
  name = "AddDashboardIndexes1760000010000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX ix_transactions_business_created
      ON loyalty_transactions (business_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_transactions_business_branch_created
      ON loyalty_transactions (business_id, branch_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_transactions_business_account_created
      ON loyalty_transactions (business_id, account_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_redemptions_business_created
      ON redemptions (business_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_customers_business_created
      ON customers (business_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_wallet_passes_business_created
      ON wallet_passes (business_id, created_at)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE redemptions DROP FOREIGN KEY fk_redemptions_business",
    );
    await queryRunner.query(
      "DROP INDEX ix_wallet_passes_business_created ON wallet_passes",
    );
    await queryRunner.query(
      "DROP INDEX ix_customers_business_created ON customers",
    );
    await queryRunner.query(
      "DROP INDEX ix_redemptions_business_created ON redemptions",
    );
    await queryRunner.query(
      `ALTER TABLE redemptions
      ADD CONSTRAINT fk_redemptions_business
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      "DROP INDEX ix_transactions_business_account_created ON loyalty_transactions",
    );
    await queryRunner.query(
      "DROP INDEX ix_transactions_business_branch_created ON loyalty_transactions",
    );
    await queryRunner.query(
      "DROP INDEX ix_transactions_business_created ON loyalty_transactions",
    );
  }
}
