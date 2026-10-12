import { MigrationInterface, QueryRunner } from "typeorm";
import { randomBytes } from "node:crypto";

export class CreateCustomerPrivacy1760000007000 implements MigrationInterface {
  name = "CreateCustomerPrivacy1760000007000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE businesses
      ADD COLUMN public_code VARCHAR(16) NULL,
      ADD COLUMN brand_color VARCHAR(7) NULL,
      ADD COLUMN logo_url VARCHAR(500) NULL,
      ADD COLUMN registration_fields JSON NOT NULL DEFAULT ('[{"key":"name","required":true},{"key":"email","required":true}]')`);
    const businesses: { id: string; public_code: string | null }[] =
      await queryRunner.query("SELECT id, public_code FROM businesses");
    for (const business of businesses) {
      if (business.public_code) continue;
      let code = randomBytes(12).toString("base64url");
      while (
        (
          await queryRunner.query(
            "SELECT id FROM businesses WHERE public_code = ?",
            [code],
          )
        ).length
      )
        code = randomBytes(12).toString("base64url");
      await queryRunner.query(
        "UPDATE businesses SET public_code = ? WHERE id = ?",
        [code, business.id],
      );
    }
    await queryRunner.query(
      "ALTER TABLE businesses MODIFY public_code VARCHAR(16) NOT NULL, ADD UNIQUE KEY uq_businesses_public_code (public_code)",
    );
    await queryRunner.query(`CREATE TABLE customers (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL, email VARCHAR(320) NULL, phone VARCHAR(32) NULL,
      birthday DATE NULL, status ENUM('active','anonymized') NOT NULL DEFAULT 'active',
      anonymized_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_customers_business_email (business_id,email),
      UNIQUE KEY uq_customers_business_phone (business_id,phone),
      CONSTRAINT fk_customers_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE privacy_notices (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL,
      version INT NOT NULL, text TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_privacy_notices_business_version (business_id,version),
      CONSTRAINT fk_privacy_notices_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE consents (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, customer_id CHAR(36) NOT NULL,
      purpose ENUM('privacy_notice','marketing') NOT NULL,
      channel ENUM('wallet','email','sms','all') NOT NULL,
      notice_version INT NULL, status ENUM('granted','revoked') NOT NULL,
      origin ENUM('registration','recovery_link','admin','arco') NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_consents_customer (business_id,customer_id,purpose,channel,created_at),
      CONSTRAINT fk_consents_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_consents_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE wallet_passes (
      id CHAR(36) NOT NULL PRIMARY KEY, business_id CHAR(36) NOT NULL, account_id CHAR(36) NOT NULL,
      platform ENUM('google','apple') NOT NULL, external_ref VARCHAR(500) NULL,
      status ENUM('issued','disabled') NOT NULL DEFAULT 'issued',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_wallet_passes_account (business_id,account_id),
      CONSTRAINT fk_wallet_passes_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_wallet_passes_account FOREIGN KEY (account_id) REFERENCES loyalty_accounts(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`ALTER TABLE loyalty_accounts
      ADD CONSTRAINT fk_loyalty_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE loyalty_accounts DROP FOREIGN KEY fk_loyalty_accounts_customer",
    );
    await queryRunner.query("DROP TABLE wallet_passes");
    await queryRunner.query("DROP TABLE consents");
    await queryRunner.query("DROP TABLE privacy_notices");
    await queryRunner.query("DROP TABLE customers");
    await queryRunner.query(
      "ALTER TABLE businesses DROP INDEX uq_businesses_public_code, DROP COLUMN registration_fields, DROP COLUMN logo_url, DROP COLUMN brand_color, DROP COLUMN public_code",
    );
  }
}
