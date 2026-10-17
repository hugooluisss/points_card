import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDashboardEligibilityPeriodIndex1760000016000 implements MigrationInterface {
  name = "AddDashboardEligibilityPeriodIndex1760000016000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE INDEX ix_transactions_eligibility_period ON loyalty_transactions (business_id, created_at, account_id, program_id, branch_id, amount)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX ix_transactions_eligibility_period ON loyalty_transactions",
    );
  }
}
