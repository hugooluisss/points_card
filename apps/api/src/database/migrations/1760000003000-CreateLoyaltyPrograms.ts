import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLoyaltyPrograms1760000003000 implements MigrationInterface {
  name = "CreateLoyaltyPrograms1760000003000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE programs (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL, mode ENUM('stamps','points') NOT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
      active_mode_key VARCHAR(6) GENERATED ALWAYS AS (IF(status = 'active', mode, NULL)) STORED,
      valid_from DATE NOT NULL, valid_until DATE NULL, stamps_goal INT NULL,
      points_per_currency_unit DECIMAL(10,4) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_programs_business_active_mode (business_id, active_mode_key),
      CONSTRAINT fk_programs_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE rewards (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, program_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL, cost INT NOT NULL, conditions TEXT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY ix_rewards_business_program (business_id, program_id),
      CONSTRAINT fk_rewards_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_rewards_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    )`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE rewards");
    await queryRunner.query("DROP TABLE programs");
  }
}
