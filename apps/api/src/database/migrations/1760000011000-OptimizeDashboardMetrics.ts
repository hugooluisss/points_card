import { MigrationInterface, QueryRunner } from "typeorm";

export class OptimizeDashboardMetrics1760000011000 implements MigrationInterface {
  name = "OptimizeDashboardMetrics1760000011000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE INDEX ix_transactions_reversal_business ON loyalty_transactions (reverses_transaction_id, business_id)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE loyalty_transactions DROP FOREIGN KEY fk_loyalty_transactions_reversal",
    );
    await queryRunner.query(
      "DROP INDEX ix_transactions_reversal_business ON loyalty_transactions",
    );
    await queryRunner.query(
      "ALTER TABLE loyalty_transactions ADD CONSTRAINT fk_loyalty_transactions_reversal FOREIGN KEY (reverses_transaction_id) REFERENCES loyalty_transactions(id)",
    );
  }
}
