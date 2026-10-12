import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBilling1760000009000 implements MigrationInterface {
  name = "CreateBilling1760000009000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE plans (
      id CHAR(36) NOT NULL PRIMARY KEY, name VARCHAR(100) NOT NULL,
      price_monthly DECIMAL(10,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'MXN',
      max_branches INT NOT NULL, max_staff INT NOT NULL, max_cards INT NOT NULL,
      stripe_price_id VARCHAR(255) NULL UNIQUE, is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await queryRunner.query(`CREATE TABLE subscriptions (
      business_id CHAR(36) NOT NULL PRIMARY KEY, plan_id CHAR(36) NOT NULL,
      status ENUM('trial','active','past_due','canceled') NOT NULL,
      stripe_customer_id VARCHAR(255) NULL, stripe_subscription_id VARCHAR(255) NULL UNIQUE,
      trial_ends_at TIMESTAMP NOT NULL, current_period_end TIMESTAMP NULL,
      grace_ends_at TIMESTAMP NULL, canceled_at TIMESTAMP NULL, retention_ends_at TIMESTAMP NULL,
      last_stripe_event_created INT NULL,
      created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL,
      CONSTRAINT fk_subscriptions_business FOREIGN KEY (business_id)
        REFERENCES businesses(id) ON DELETE CASCADE,
      CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
    )`);
    await queryRunner.query(`CREATE TABLE billing_events (
      stripe_event_id VARCHAR(255) NOT NULL PRIMARY KEY, type VARCHAR(255) NOT NULL,
      received_at TIMESTAMP NOT NULL, processed_at TIMESTAMP NULL,
      processing_until TIMESTAMP NULL
    )`);
    // Exploratory placeholder prices; edit plan rows as commercial pricing is confirmed.
    await queryRunner.query(`INSERT INTO plans
      (id,name,price_monthly,currency,max_branches,max_staff,max_cards,is_active)
      VALUES ('00000000-0000-4000-8000-000000000001','Básico',149.00,'MXN',1,3,500,TRUE),
      ('00000000-0000-4000-8000-000000000002','Negocio',299.00,'MXN',5,15,5000,TRUE)`);
    await queryRunner.query(`INSERT INTO subscriptions
      (business_id,plan_id,status,trial_ends_at,created_at,updated_at)
      SELECT id,'00000000-0000-4000-8000-000000000001','trial',
      DATE_ADD(UTC_TIMESTAMP(), INTERVAL 14 DAY),UTC_TIMESTAMP(),UTC_TIMESTAMP() FROM businesses`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE billing_events");
    await queryRunner.query("DROP TABLE subscriptions");
    await queryRunner.query("DROP TABLE plans");
  }
}
