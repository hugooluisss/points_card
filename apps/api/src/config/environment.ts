export class Environment {
  DB_HOST!: string;
  DB_PORT!: number;
  DB_USERNAME!: string;
  DB_PASSWORD!: string;
  DB_DATABASE!: string;
  DB_DATABASE_TEST!: string;
  JWT_ACCESS_SECRET!: string;
  JWT_REFRESH_SECRET!: string;
  AUTH_COOKIE_PATH?: string;
  BUSINESS_TIMEZONE?: string;
  PUBLIC_WEB_URL?: string;
  RECOVERY_NOTIFIER?: string;
  WALLET_PASS_PROVIDER?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  BILLING_RETURN_URL?: string;
  BILLING_GRACE_DAYS?: number;
  BILLING_RETENTION_DAYS?: number;
  BILLING_RECONCILIATION_CRON?: string;
}
