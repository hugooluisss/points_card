import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessesAndBranches1760000000000 implements MigrationInterface {
  name = 'CreateBusinessesAndBranches1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE businesses (
      id CHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
      plan VARCHAR(100) NOT NULL DEFAULT 'trial',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await queryRunner.query(`CREATE TABLE branches (
      id CHAR(36) NOT NULL PRIMARY KEY,
      business_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_branches_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE branches');
    await queryRunner.query('DROP TABLE businesses');
  }
}
