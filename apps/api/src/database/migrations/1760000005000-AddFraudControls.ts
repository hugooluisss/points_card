import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFraudControls1760000005000 implements MigrationInterface {
  name = "AddFraudControls1760000005000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE programs
      ADD min_interval_minutes INT NULL,
      ADD max_accumulations_per_card_per_day INT NULL,
      ADD max_accumulations_per_staff_per_day INT NULL,
      ADD max_points_per_operation INT NULL,
      ADD staff_daily_alert_threshold INT NULL`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE programs
      DROP COLUMN staff_daily_alert_threshold,
      DROP COLUMN max_points_per_operation,
      DROP COLUMN max_accumulations_per_staff_per_day,
      DROP COLUMN max_accumulations_per_card_per_day,
      DROP COLUMN min_interval_minutes`);
  }
}
