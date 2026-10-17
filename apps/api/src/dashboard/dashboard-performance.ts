import "reflect-metadata";
import { config } from "dotenv";
config({ path: "apps/api/.env" });
process.env.NODE_ENV = "test";

import { randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import { NestFactory } from "@nestjs/core";
import request from "supertest";
import { DataSource } from "typeorm";
import { AppModule } from "../app.module";
import { configureApp } from "../configure-app";
import { Clock } from "../ledger/clock";

const batchSize = 500;
const now = new Date("2026-10-15T18:00:00.000Z");
const timestamp = (date: Date) =>
  date.toISOString().slice(0, 19).replace("T", " ");

async function insertRows(
  db: DataSource,
  table: string,
  columns: string[],
  rows: unknown[][],
) {
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values = batch
      .map(() => `(${columns.map(() => "?").join(",")})`)
      .join(",");
    await db.query(
      `INSERT INTO ${table} (${columns.join(",")}) VALUES ${values}`,
      batch.flat(),
    );
  }
}

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  await app.init();
  const db = app.get(DataSource);
  const clock = app.get(Clock);
  clock.now = () => new Date(now);
  const testDb = process.env.DB_DATABASE_TEST;
  const [{ selected_database: selected }] = await db.query(
    "SELECT DATABASE() AS selected_database",
  );
  if (
    !testDb?.endsWith("_test") ||
    testDb !== "points_card_test" ||
    selected !== testDb ||
    testDb === process.env.DB_DATABASE
  ) {
    await app.close();
    throw new Error("Refusing performance seed outside points_card_test.");
  }
  await db.runMigrations();
  await db.query("SET time_zone = '+00:00'");

  const tag = randomUUID();
  let businessId = randomUUID();
  let branchIds = [randomUUID(), randomUUID()];
  let staffIds = [randomUUID(), randomUUID(), randomUUID()];
  const programIds = [randomUUID(), randomUUID()];
  const rewardId = randomUUID();
  const customerIds = Array.from({ length: 10_000 }, () => randomUUID());
  const accountIds = Array.from({ length: 20_000 }, () => randomUUID());
  const stamp = timestamp(now);
  let seeded = false;
  try {
    if (process.env.REUSE_SEED === "1") {
      const [business] = await db.query(
        "SELECT id FROM businesses WHERE name LIKE 'performance-%' ORDER BY created_at DESC LIMIT 1",
      );
      if (!business)
        throw new Error("No performance seed exists in points_card_test.");
      businessId = business.id;
      branchIds = (
        await db.query(
          "SELECT id FROM branches WHERE business_id=? ORDER BY id",
          [businessId],
        )
      ).map((row: any) => row.id);
      staffIds = (
        await db.query(
          "SELECT id FROM staff_users WHERE business_id=? ORDER BY role",
          [businessId],
        )
      ).map((row: any) => row.id);
      seeded = true;
    } else {
      const [plan] = await db.query(
        "SELECT id FROM plans WHERE name='Básico' AND is_active=1 LIMIT 1",
      );
      if (!plan) throw new Error("Missing active Básico plan in test DB.");
      await db.query(
        "INSERT INTO businesses (id,name,status,plan,public_code,brand_color,logo_url,registration_fields,created_at,updated_at) VALUES (?,?,'active','trial',?,'#168c8c',NULL,?,?,?)",
        [
          businessId,
          `performance-${tag}`,
          tag.slice(0, 16),
          '[{"key":"name","required":true}]',
          stamp,
          stamp,
        ],
      );
      seeded = true;
      await db.query(
        "INSERT INTO subscriptions (business_id,plan_id,status,trial_ends_at,created_at,updated_at) VALUES (?,?,'trial',?,?,?)",
        [
          businessId,
          plan.id,
          timestamp(new Date(now.getTime() + 14 * 86400000)),
          stamp,
          stamp,
        ],
      );
      await insertRows(
        db,
        "branches",
        ["id", "business_id", "name", "is_default", "created_at", "updated_at"],
        branchIds.map((id, i) => [
          id,
          businessId,
          `Sucursal ${i + 1}`,
          i === 0,
          stamp,
          stamp,
        ]),
      );
      await insertRows(
        db,
        "staff_users",
        [
          "id",
          "business_id",
          "name",
          "email",
          "password_hash",
          "role",
          "is_active",
          "branch_ids",
          "created_at",
          "updated_at",
        ],
        staffIds.map((id, i) => [
          id,
          businessId,
          `Personal ${i + 1}`,
          `perf-${tag}-${i}@example.test`,
          "unused",
          i ? "manager" : "owner",
          1,
          null,
          stamp,
          stamp,
        ]),
      );
      await insertRows(
        db,
        "programs",
        [
          "id",
          "business_id",
          "name",
          "mode",
          "status",
          "valid_from",
          "stamps_goal",
          "points_per_currency_unit",
          "created_at",
          "updated_at",
        ],
        programIds.map((id, i) => [
          id,
          businessId,
          i ? "Puntos" : "Sellos",
          i ? "points" : "stamps",
          "active",
          "2025-10-15",
          i ? null : 10,
          i ? 1 : null,
          stamp,
          stamp,
        ]),
      );
      await db.query(
        "INSERT INTO rewards (id,business_id,program_id,name,cost,is_active,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)",
        [rewardId, businessId, programIds[0], "Recompensa", 10, stamp, stamp],
      );
      for (let offset = 0; offset < customerIds.length; offset += batchSize) {
        await insertRows(
          db,
          "customers",
          [
            "id",
            "business_id",
            "name",
            "email",
            "phone",
            "status",
            "created_at",
            "updated_at",
          ],
          customerIds.slice(offset, offset + batchSize).map((id, j) => {
            const i = offset + j;
            return [
              id,
              businessId,
              `Cliente ${i}`,
              `perf-${tag}-${i}@example.test`,
              `+521${String(i).padStart(10, "0")}`,
              "active",
              timestamp(new Date(now.getTime() - (i % 365) * 86400000)),
              stamp,
            ];
          }),
        );
      }
      for (let offset = 0; offset < accountIds.length; offset += batchSize) {
        const accounts = accountIds.slice(offset, offset + batchSize);
        await insertRows(
          db,
          "loyalty_accounts",
          [
            "id",
            "business_id",
            "program_id",
            "card_code",
            "customer_id",
            "balance",
            "status",
            "created_at",
            "updated_at",
          ],
          accounts.map((id, j) => {
            const i = offset + j;
            return [
              id,
              businessId,
              programIds[i % 2],
              `${tag.slice(0, 8)}-${i}`,
              customerIds[i % customerIds.length],
              i % 20,
              "active",
              stamp,
              stamp,
            ];
          }),
        );
        await insertRows(
          db,
          "wallet_passes",
          [
            "id",
            "business_id",
            "account_id",
            "platform",
            "external_ref",
            "status",
            "created_at",
          ],
          accounts.map((id, j) => {
            const i = offset + j;
            return [
              randomUUID(),
              businessId,
              id,
              i % 2 ? "apple" : "google",
              `perf-${i}`,
              "issued",
              timestamp(new Date(now.getTime() - (i % 365) * 86400000)),
            ];
          }),
        );
      }
      const types = [
        "accumulate",
        "accumulate",
        "accumulate",
        "redeem",
        "adjust",
      ];
      const redemptionRows: unknown[][] = [];
      for (let offset = 0; offset < 200_000; offset += batchSize) {
        const movements = Array.from(
          { length: Math.min(batchSize, 200_000 - offset) },
          (_, j) => {
            const i = offset + j;
            const id = randomUUID();
            const type = types[i % types.length];
            const row = [
              id,
              businessId,
              branchIds[i % branchIds.length],
              accountIds[i % accountIds.length],
              programIds[i % 2],
              type,
              type === "redeem" ? -10 : 1,
              type === "accumulate" ? 100 : null,
              type === "redeem" ? rewardId : null,
              `perf-${i}`,
              null,
              null,
              staffIds[i % staffIds.length],
              `perf-${tag}-${i}`,
              timestamp(new Date(now.getTime() - (i % 365) * 86400000)),
            ];
            if (type === "redeem")
              redemptionRows.push([
                randomUUID(),
                businessId,
                row[3],
                rewardId,
                id,
                "completed",
                row[14],
              ]);
            return row;
          },
        );
        await insertRows(
          db,
          "loyalty_transactions",
          [
            "id",
            "business_id",
            "branch_id",
            "account_id",
            "program_id",
            "type",
            "amount",
            "purchase_amount",
            "reward_id",
            "reference",
            "reason",
            "reverses_transaction_id",
            "actor_id",
            "idempotency_key",
            "created_at",
          ],
          movements,
        );
      }
      await insertRows(
        db,
        "redemptions",
        [
          "id",
          "business_id",
          "account_id",
          "reward_id",
          "transaction_id",
          "status",
          "created_at",
        ],
        redemptionRows,
      );
      seeded = true;
    }
    const diagnostic = [
      [
        "registrations",
        `SELECT COUNT(*) AS total FROM customers WHERE business_id=? AND created_at>=? AND created_at<?`,
        [businessId, new Date(now.getTime() - 90 * 86400000), now],
      ],
      [
        "issuedPasses",
        `SELECT COUNT(*) AS total FROM wallet_passes WHERE business_id=? AND created_at>=? AND created_at<?`,
        [businessId, new Date(now.getTime() - 90 * 86400000), now],
      ],
      [
        "activeCustomers",
        `SELECT COUNT(DISTINCT a.customer_id) AS total FROM loyalty_transactions t FORCE INDEX (ix_transactions_business_created) JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business) ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id WHERE t.business_id=? AND t.created_at>=? AND t.created_at<? AND t.type IN ('accumulate','redeem','adjust') AND a.customer_id IS NOT NULL AND r.id IS NULL`,
        [businessId, new Date(now.getTime() - 90 * 86400000), now],
      ],
      [
        "metricsCustomerActivity",
        `SELECT COUNT(*) AS active,SUM(accumulations>=2) AS repeatCustomers FROM (SELECT a.customer_id,SUM(t.type='accumulate') AS accumulations FROM loyalty_transactions t FORCE INDEX (ix_transactions_metrics_period) JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business) ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id WHERE t.business_id=? AND t.created_at>=? AND t.created_at<? AND t.type IN ('accumulate','redeem','adjust') AND a.customer_id IS NOT NULL AND r.id IS NULL GROUP BY a.customer_id) customer_activity`,
        [businessId, new Date(now.getTime() - 90 * 86400000), now],
      ],
      [
        "repeatCustomers",
        `SELECT COUNT(*) AS total FROM (SELECT a.customer_id FROM loyalty_transactions t FORCE INDEX (ix_transactions_business_created) JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business) ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id WHERE t.business_id=? AND t.created_at>=? AND t.created_at<? AND t.type='accumulate' AND a.customer_id IS NOT NULL AND r.id IS NULL GROUP BY a.customer_id HAVING COUNT(*)>=2) x`,
        [businessId, new Date(now.getTime() - 90 * 86400000), now],
      ],
      [
        "redemptions",
        `SELECT COUNT(*) AS total FROM redemptions r JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id WHERE r.business_id=? AND r.created_at>=? AND r.created_at<? AND r.status='completed'`,
        [businessId, new Date(now.getTime() - 90 * 86400000), now],
      ],
      [
        "eligibleOpening",
        `SELECT account_id,SUM(amount) AS balance FROM loyalty_transactions FORCE INDEX (ix_transactions_eligibility_period) WHERE business_id=? AND created_at<? GROUP BY account_id`,
        [businessId, new Date(now.getTime() - 90 * 86400000)],
      ],
      [
        "eligiblePeriodRows",
        `SELECT account_id,program_id,branch_id,created_at,id,amount FROM loyalty_transactions FORCE INDEX (ix_transactions_eligibility_period) WHERE business_id=? AND created_at>=? AND created_at<? ORDER BY account_id,created_at,id`,
        [businessId, new Date(now.getTime() - 90 * 86400000), now],
      ],
      [
        "redemptionPage",
        `SELECT STRAIGHT_JOIN r.id,CASE WHEN c.status='anonymized' THEN 'Cliente anonimizado' ELSE c.name END AS customerName,a.card_code AS cardCode,w.name AS rewardName,ABS(t.amount) AS cost,r.status,b.name AS branchName,s.name AS staffName,r.created_at AS createdAt FROM redemptions r FORCE INDEX (ix_redemptions_business_created) JOIN loyalty_accounts a ON a.id=r.account_id AND a.business_id=r.business_id LEFT JOIN customers c ON c.id=a.customer_id AND c.business_id=a.business_id JOIN rewards w ON w.id=r.reward_id AND w.business_id=r.business_id JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id JOIN branches b ON b.id=t.branch_id AND b.business_id=t.business_id JOIN staff_users s ON s.id=t.actor_id AND s.business_id=t.business_id WHERE r.business_id=? AND r.created_at>=? AND r.created_at<? ORDER BY r.created_at DESC,r.id DESC LIMIT 50`,
        [businessId, new Date(now.getTime() - 365 * 86400000), now],
      ],
      [
        "redemptionCount",
        `SELECT COUNT(*) AS total FROM redemptions r WHERE r.business_id=? AND r.created_at>=? AND r.created_at<?`,
        [businessId, new Date(now.getTime() - 365 * 86400000), now],
      ],
    ] as [string, string, unknown[]][];
    const runner = db.createQueryRunner();
    await runner.connect();
    try {
      await runner.query("SET SESSION max_execution_time=15000");
      const diagnostics: {
        name: string;
        elapsedMs: number;
        rows?: unknown;
        error?: string;
      }[] = [];
      for (const [name, sql, parameters] of diagnostic) {
        const started = process.hrtime.bigint();
        try {
          const rows = await runner.query(sql, parameters);
          diagnostics.push({
            name,
            elapsedMs: Number(process.hrtime.bigint() - started) / 1e6,
            rows: [
              "eligibleOpening",
              "eligiblePeriodRows",
              "movementExport",
              "redemptionPage",
            ].includes(name)
              ? { count: rows.length, first: rows[0] }
              : rows,
          });
        } catch (error) {
          diagnostics.push({
            name,
            elapsedMs: Number(process.hrtime.bigint() - started) / 1e6,
            error: String(error),
          });
        }
      }
      console.log("METRIC_SQL_DIAGNOSTICS", JSON.stringify(diagnostics));
      for (const [name, sql, parameters] of diagnostic.filter(([name]) =>
        [
          "metricsCustomerActivity",
          "eligibleOpening",
          "eligiblePeriodRows",
          "redemptionPage",
          "redemptionCount",
        ].includes(name),
      )) {
        try {
          console.log(
            "METRIC_EXPLAIN",
            name,
            JSON.stringify(await runner.query(`EXPLAIN ${sql}`, parameters)),
          );
        } catch (error) {
          console.log("METRIC_EXPLAIN_ERROR", name, String(error));
        }
      }
      for (const [name, sql, parameters] of diagnostic.filter(([name]) =>
        ["eligibleOpening", "eligiblePeriodRows"].includes(name),
      )) {
        try {
          console.log(
            "METRIC_EXPLAIN_ANALYZE",
            name,
            JSON.stringify(
              await runner.query(`EXPLAIN ANALYZE ${sql}`, parameters),
            ),
          );
        } catch (error) {
          console.log("METRIC_EXPLAIN_ANALYZE_ERROR", name, String(error));
        }
      }
      try {
        console.log(
          "METRIC_EXPLAIN_ANALYZE",
          JSON.stringify(
            await runner.query(
              `EXPLAIN ANALYZE ${diagnostic.find(([name]) => name === "metricsCustomerActivity")![1]}`,
              diagnostic.find(
                ([name]) => name === "metricsCustomerActivity",
              )![2],
            ),
          ),
        );
      } catch (error) {
        console.log("METRIC_EXPLAIN_ANALYZE_UNAVAILABLE", String(error));
      }
      const summarySql: [string, string, unknown[]][] = [
        [
          "summaryCustomersCurrent",
          "SELECT COUNT(*) total FROM customers FORCE INDEX (ix_customers_business_created) WHERE business_id=? AND created_at>=? AND created_at<?",
          [businessId, new Date(now.getTime() - 90 * 86400000), now],
        ],
        [
          "summaryPassesCurrent",
          "SELECT COUNT(*) total FROM wallet_passes FORCE INDEX (ix_wallet_passes_business_created) WHERE business_id=? AND created_at>=? AND created_at<?",
          [businessId, new Date(now.getTime() - 90 * 86400000), now],
        ],
        [
          "summaryOperationsCurrent",
          "SELECT t.created_at,COUNT(*) count FROM loyalty_transactions t FORCE INDEX (ix_transactions_metrics_period) LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business) ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id WHERE t.business_id=? AND t.created_at>=? AND t.created_at<? AND t.type IN ('accumulate','redeem','adjust') AND r.id IS NULL GROUP BY t.created_at",
          [businessId, new Date(now.getTime() - 90 * 86400000), now],
        ],
        [
          "summaryOperationsPrevious",
          "SELECT COUNT(*) total FROM loyalty_transactions t FORCE INDEX (ix_transactions_metrics_period) LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business) ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id WHERE t.business_id=? AND t.created_at>=? AND t.created_at<? AND t.type IN ('accumulate','redeem','adjust') AND r.id IS NULL",
          [
            businessId,
            new Date(now.getTime() - 180 * 86400000),
            new Date(now.getTime() - 90 * 86400000),
          ],
        ],
        [
          "summaryRedemptionsCurrent",
          "SELECT COUNT(*) total FROM redemptions r FORCE INDEX (ix_redemptions_business_created) WHERE r.business_id=? AND r.created_at>=? AND r.created_at<? AND r.status='completed'",
          [businessId, new Date(now.getTime() - 90 * 86400000), now],
        ],
        [
          "summaryCustomersPrevious",
          "SELECT COUNT(*) total FROM customers FORCE INDEX (ix_customers_business_created) WHERE business_id=? AND created_at>=? AND created_at<?",
          [
            businessId,
            new Date(now.getTime() - 180 * 86400000),
            new Date(now.getTime() - 90 * 86400000),
          ],
        ],
        [
          "summaryPassesPrevious",
          "SELECT COUNT(*) total FROM wallet_passes FORCE INDEX (ix_wallet_passes_business_created) WHERE business_id=? AND created_at>=? AND created_at<?",
          [
            businessId,
            new Date(now.getTime() - 180 * 86400000),
            new Date(now.getTime() - 90 * 86400000),
          ],
        ],
        [
          "summaryRedemptionsPrevious",
          "SELECT COUNT(*) total FROM redemptions r FORCE INDEX (ix_redemptions_business_created) WHERE r.business_id=? AND r.created_at>=? AND r.created_at<? AND r.status='completed'",
          [
            businessId,
            new Date(now.getTime() - 180 * 86400000),
            new Date(now.getTime() - 90 * 86400000),
          ],
        ],
        [
          "summaryRecentActivity",
          "SELECT t.id,t.type,CASE WHEN c.status='anonymized' THEN 'Cliente anonimizado' ELSE c.name END customerName,a.card_code cardCode,t.amount,p.name programName,s.name staffName,b.name branchName,t.created_at createdAt FROM loyalty_transactions t FORCE INDEX (ix_transactions_business_created) JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id LEFT JOIN customers c ON c.id=a.customer_id AND c.business_id=a.business_id JOIN programs p ON p.id=t.program_id AND p.business_id=t.business_id JOIN staff_users s ON s.id=t.actor_id AND s.business_id=t.business_id JOIN branches b ON b.id=t.branch_id AND b.business_id=t.business_id WHERE t.business_id=? AND t.created_at>=? AND t.created_at<? ORDER BY t.created_at DESC,t.id DESC LIMIT ? OFFSET ?",
          [businessId, new Date(now.getTime() - 90 * 86400000), now, 10, 0],
        ],
      ];
      for (const [name, sql, parameters] of summarySql) {
        const started = process.hrtime.bigint();
        try {
          const plan = await runner.query(`EXPLAIN ANALYZE ${sql}`, parameters);
          console.log(
            "SUMMARY_EXPLAIN_ANALYZE",
            name,
            Number(process.hrtime.bigint() - started) / 1e6,
            JSON.stringify(plan),
          );
        } catch (error) {
          console.log("SUMMARY_EXPLAIN_ANALYZE_ERROR", name, String(error));
        }
      }
    } finally {
      await runner.release();
    }
    if (process.env.DIAG_ONLY === "1") return;
    const { TokenService } = await import("../auth/token.service");
    const authToken = await app
      .get(TokenService)
      .issue({
        id: staffIds[0],
        name: "Owner",
        role: "owner" as any,
        businessId,
        branchIds: null,
      });
    const auth = { Authorization: `Bearer ${authToken.accessToken}` };
    const urls = [
      ["Inicio", "/dashboard/summary?period=90d"],
      ["Métricas", "/metrics?period=90d"],
      ["Sucursales", "/branches"],
      ["Personal", "/staff/options"],
      [
        "Movimientos",
        "/movements?from=2025-10-15&to=2026-10-15&page=1&pageSize=50",
      ],
      [
        "Canjes",
        "/redemptions?from=2025-10-15&to=2026-10-15&page=1&pageSize=50",
      ],
      ["Exportar clientes", "/exports/customers.csv"],
    ] as const;
    const results: Record<string, number[]> = {};
    for (const [name, url] of urls) {
      const call = () =>
        request(app.getHttpServer())
          .get(url)
          .set(auth)
          .timeout({ response: 30000 })
          .then((response) => {
            if (response.status !== 200)
              throw new Error(
                `${url}: HTTP ${response.status} ${response.text}`,
              );
          });
      await call();
      results[name] = [];
      for (let run = 0; run < 10; run++) {
        const start = process.hrtime.bigint();
        await call();
        results[name].push(Number(process.hrtime.bigint() - start) / 1e6);
      }
    }
    const summary = Object.fromEntries(
      Object.entries(results).map(([name, times]) => {
        const sorted = [...times].sort((a, b) => a - b);
        return [
          name,
          {
            min: sorted[0],
            median: (sorted[4] + sorted[5]) / 2,
            max: sorted[9],
            runs: times,
          },
        ];
      }),
    );
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string")
      throw new Error("HTTP server did not bind.");
    const exportTtfb = () =>
      new Promise<number>((resolve, reject) => {
        const started = process.hrtime.bigint();
        const req = httpRequest(
          {
            host: "127.0.0.1",
            port: address.port,
            path: "/exports/movements.csv?from=2025-10-15&to=2026-10-15",
            headers: auth,
          },
          (response) => {
            if (response.statusCode !== 200)
              return reject(
                new Error(
                  `CSV TTFB request returned HTTP ${response.statusCode}`,
                ),
              );
            let elapsed: number | undefined;
            response.on("data", () => {
              if (elapsed === undefined)
                elapsed = Number(process.hrtime.bigint() - started) / 1e6;
            });
            response.resume();
            response.on("end", () =>
              elapsed === undefined
                ? reject(new Error("CSV response ended without a body byte."))
                : resolve(elapsed),
            );
          },
        );
        req.on("error", reject);
        req.end();
      });
    await exportTtfb();
    const ttfbRuns: number[] = [];
    for (let run = 0; run < 10; run++) ttfbRuns.push(await exportTtfb());
    const sortedTtfb = [...ttfbRuns].sort((a, b) => a - b);
    const plans = await db.query(
      "EXPLAIN SELECT COUNT(*) AS total FROM loyalty_transactions t WHERE t.business_id = ? AND t.created_at >= ? AND t.created_at < ? AND t.type IN ('accumulate','redeem','adjust') AND NOT EXISTS (SELECT 1 FROM loyalty_transactions r WHERE r.business_id=t.business_id AND r.reverses_transaction_id=t.id)",
      [businessId, new Date(now.getTime() - 90 * 86400000), now],
    );
    const scans = await db.query(
      "EXPLAIN SELECT r.id FROM redemptions r JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id WHERE r.business_id=? AND r.created_at>=? AND r.created_at<? ORDER BY r.created_at DESC LIMIT 50",
      [businessId, new Date(now.getTime() - 365 * 86400000), now],
    );
    console.log(
      JSON.stringify(
        {
          assumptions: {
            customers: 10000,
            accountsAndPasses: 20000,
            movements: 200000,
            months: 12,
            thresholdMs: 1000,
          },
          results: summary,
          exportTtfb: {
            min: sortedTtfb[0],
            median: (sortedTtfb[4] + sortedTtfb[5]) / 2,
            max: sortedTtfb[9],
            runs: ttfbRuns,
          },
          explain: { dashboardSummaryTransactions: plans, redemptions: scans },
        },
        null,
        2,
      ),
    );
  } finally {
    if (seeded && process.env.KEEP_SEED !== "1") {
      await db.query("DELETE FROM redemptions WHERE business_id=?", [
        businessId,
      ]);
      await db.query(
        "DELETE FROM loyalty_transactions FORCE INDEX (ix_transactions_dashboard_account_ledger) WHERE business_id=?",
        [businessId],
      );
      await db.query("DELETE FROM businesses WHERE id=?", [businessId]);
    }
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
