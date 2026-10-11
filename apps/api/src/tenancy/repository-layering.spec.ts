import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

describe("repository tenant scoping", () => {
  it("requires every repository class to extend the tenant base or be explicitly allow-listed", () => {
    const root = join(__dirname, "..");
    const files = readdirSync(root, { recursive: true }).filter(
      (path): path is string =>
        typeof path === "string" &&
        path.endsWith(".repository.ts") &&
        path !== "tenancy/base-tenant.repository.ts",
    );
    const allowListed = new Set([
      "businesses/business.repository.ts",
      "audit/audit.repository.ts",
      "auth/auth.repository.ts",
      "ledger/ledger.repository.ts",
    ]);
    for (const file of files) {
      const source = readFileSync(join(root, file), "utf8");
      if (allowListed.has(file)) {
        expect(source).toMatch(/Allow-listed:/);
      } else {
        expect(source).toMatch(/extends BaseTenantRepository/);
      }
    }
  });
});
