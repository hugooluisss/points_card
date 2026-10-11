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
}
