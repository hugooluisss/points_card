import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthAndAudit1760000002000 implements MigrationInterface {
  name = "CreateAuthAndAudit1760000002000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE refresh_tokens (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, staff_user_id CHAR(36) NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE, family_id CHAR(36) NOT NULL, expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_refresh_family (family_id), KEY ix_refresh_user (staff_user_id),
      CONSTRAINT fk_refresh_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_refresh_staff FOREIGN KEY (staff_user_id) REFERENCES staff_users(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE audit_logs (
      id CHAR(36) NOT NULL PRIMARY KEY, actor_id CHAR(36) NULL, business_id CHAR(36) NULL,
      action VARCHAR(100) NOT NULL, target_id VARCHAR(255) NULL, result ENUM('success','failure') NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY ix_audit_business (business_id), KEY ix_audit_actor (actor_id)
    )`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE audit_logs");
    await queryRunner.query("DROP TABLE refresh_tokens");
  }
}
