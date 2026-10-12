import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCardRecoveryTokens1760000008000 implements MigrationInterface {
  name = "CreateCardRecoveryTokens1760000008000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE card_recovery_tokens (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL,
      customer_id CHAR(36) NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL, used_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_card_recovery_customer (business_id,customer_id),
      CONSTRAINT fk_card_recovery_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_card_recovery_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE card_recovery_tokens");
  }
}
