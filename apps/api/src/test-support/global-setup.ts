import { config } from "dotenv";
import { resolve } from "node:path";
import { prepareTestDatabase } from "../database/prepare-test-database";

export default async function globalSetup() {
  config({ path: resolve(process.cwd(), ".env"), quiet: true });
  await prepareTestDatabase();
}
