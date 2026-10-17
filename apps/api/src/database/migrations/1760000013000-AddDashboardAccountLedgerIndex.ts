import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDashboardAccountLedgerIndex1760000013000 implements MigrationInterface {
  name = "AddDashboardAccountLedgerIndex1760000013000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE INDEX ix_transactions_dashboard_account_ledger ON loyalty_transactions (business_id, account_id, created_at, program_id, amount, branch_id)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX ix_transactions_dashboard_account_ledger ON loyalty_transactions",
    );
  }
}
