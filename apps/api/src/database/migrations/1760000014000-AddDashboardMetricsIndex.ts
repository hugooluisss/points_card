import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDashboardMetricsIndex1760000014000 implements MigrationInterface {
  name = "AddDashboardMetricsIndex1760000014000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE INDEX ix_transactions_metrics_period ON loyalty_transactions (business_id, created_at, type, account_id)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX ix_transactions_metrics_period ON loyalty_transactions",
    );
  }
}
