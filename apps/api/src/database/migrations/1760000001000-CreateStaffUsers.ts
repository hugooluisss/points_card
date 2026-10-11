import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStaffUsers1760000001000 implements MigrationInterface {
  name = 'CreateStaffUsers1760000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE staff_users (
      id CHAR(36) NOT NULL PRIMARY KEY,
      business_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('owner', 'manager', 'cashier') NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      branch_ids JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_staff_users_email (email),
      CONSTRAINT fk_staff_users_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE staff_users');
  }
}
