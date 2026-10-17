import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Readable } from "node:stream";
import { csvRow } from "./csv";
import { TenantContext } from "../tenancy/tenant-context.service";

function branchFilter(column: string, branches: string[] | null) {
  if (branches === null) return "";
  return branches.length
    ? ` AND ${column} IN (${branches.map(() => "?").join(",")})`
    : " AND 1=0";
}

@Injectable()
// Allow-listed: each raw query explicitly scopes business_id and branch access.
export class DashboardRepository {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly tenant: TenantContext,
  ) {}

  private get scope() {
    const context = this.tenant.getRequestContext();
    return {
      businessId: this.tenant.getBusinessId(),
      branchIds: context?.branchIds ?? null,
    };
  }

  private branches(branchId?: string) {
    const { branchIds } = this.scope;
    if (branchId && branchIds !== null && !branchIds.includes(branchId))
      throw new ForbiddenException("No tienes acceso a esta sucursal.");
    return branchId ? [branchId] : branchIds;
  }

  async summary(
    start: Date,
    end: Date,
    previousStart: Date,
    previousEnd: Date,
    branchId?: string,
  ) {
    const { businessId } = this.scope;
    const branches = this.branches(branchId);
    const branchSql = branchFilter("t.branch_id", branches);
    const branchParams = branches ?? [];
    const previousParams = [
      businessId,
      previousStart,
      previousEnd,
      ...branchParams,
    ];
    // Registrations and issued passes have no branch column, so scope via related account activity.
    const customerBranch =
      branches === null
        ? ""
        : branches.length
          ? ` AND EXISTS (
              SELECT 1 FROM loyalty_accounts ca
              JOIN loyalty_transactions ct ON ct.account_id=ca.id AND ct.business_id=ca.business_id
              WHERE ca.business_id=customers.business_id AND ca.customer_id=customers.id
                AND ct.branch_id IN (${branches.map(() => "?").join(",")})
            )`
          : " AND 1=0";
    const passBranch =
      branches === null
        ? ""
        : branches.length
          ? ` AND EXISTS (
              SELECT 1 FROM loyalty_transactions pt
              WHERE pt.business_id=wallet_passes.business_id
                AND pt.account_id=wallet_passes.account_id
                AND pt.branch_id IN (${branches.map(() => "?").join(",")})
            )`
          : " AND 1=0";
    const [
      customerRows,
      passRows,
      operationRows,
      prevOperationRows,
      redemptionRows,
      prevCustomerRows,
      prevPassRows,
      prevRedemptionRows,
      recent,
    ] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*) AS total FROM customers FORCE INDEX (ix_customers_business_created)
        WHERE business_id = ? AND created_at >= ? AND created_at < ?${customerBranch}`,
        [businessId, start, end, ...branchParams],
      ),
      this.db.query(
        `SELECT COUNT(*) AS total FROM wallet_passes FORCE INDEX (ix_wallet_passes_business_created)
        WHERE business_id = ? AND created_at >= ? AND created_at < ?${passBranch}`,
        [businessId, start, end, ...branchParams],
      ),
      this.db.query(
        `SELECT t.created_at, COUNT(*) AS count
        FROM loyalty_transactions t FORCE INDEX (ix_transactions_metrics_period)
        LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business)
          ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id
        WHERE t.business_id = ? AND t.created_at >= ? AND t.created_at < ?
          AND t.type IN ('accumulate','redeem','adjust')${branchSql}
          AND r.id IS NULL
        GROUP BY t.created_at`,
        [businessId, start, end, ...branchParams],
      ),
      this.db.query(
        `SELECT COUNT(*) AS total
        FROM loyalty_transactions t FORCE INDEX (ix_transactions_metrics_period)
        LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business)
          ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id
        WHERE t.business_id = ? AND t.created_at >= ? AND t.created_at < ?
          AND t.type IN ('accumulate','redeem','adjust')${branchSql}
          AND r.id IS NULL`,
        previousParams,
      ),
      this.db.query(
        `SELECT COUNT(*) AS total FROM redemptions r FORCE INDEX (ix_redemptions_business_created)
        ${branches === null ? "" : "JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id"}
        WHERE r.business_id=? AND r.created_at>=? AND r.created_at<?
          AND r.status='completed'${branches === null ? "" : branchSql}`,
        [businessId, start, end, ...branchParams],
      ),
      this.db.query(
        `SELECT COUNT(*) AS total FROM customers FORCE INDEX (ix_customers_business_created)
        WHERE business_id = ? AND created_at >= ? AND created_at < ?${customerBranch}`,
        [businessId, previousStart, previousEnd, ...branchParams],
      ),
      this.db.query(
        `SELECT COUNT(*) AS total FROM wallet_passes FORCE INDEX (ix_wallet_passes_business_created)
        WHERE business_id = ? AND created_at >= ? AND created_at < ?${passBranch}`,
        [businessId, previousStart, previousEnd, ...branchParams],
      ),
      this.db.query(
        `SELECT COUNT(*) AS total
        FROM redemptions r FORCE INDEX (ix_redemptions_business_created)
        ${branches === null ? "" : "JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id"}
        WHERE r.business_id=? AND r.created_at>=? AND r.created_at<?
          AND r.status='completed'${branches === null ? "" : branchSql}`,
        [businessId, previousStart, previousEnd, ...branchParams],
      ),
      this.activity(start, end, 10, 0, branchId),
    ]);
    const currentTotal = Number(
      operationRows.reduce(
        (sum: number, row: any) => sum + Number(row.count),
        0,
      ),
    );
    return {
      customerRows,
      passRows,
      operationRows: [{ total: currentTotal }],
      redemptionRows,
      prevCustomerRows,
      prevPassRows,
      prevOperationRows,
      prevRedemptionRows,
      byDay: operationRows,
      recent,
    };
  }

  async activity(
    start: Date,
    end: Date,
    limit: number,
    offset: number,
    branchId?: string,
    staffId?: string,
    type?: string,
    customerId?: string,
  ) {
    const { businessId } = this.scope;
    const branches = this.branches(branchId);
    const filters = ["t.business_id=?", "t.created_at>=?", "t.created_at<?"];
    const params: unknown[] = [businessId, start, end];
    if (branches !== null) {
      if (!branches.length) filters.push("1=0");
      else {
        filters.push(`t.branch_id IN (${branches.map(() => "?").join(",")})`);
        params.push(...branches);
      }
    }
    if (staffId) {
      filters.push("t.actor_id=?");
      params.push(staffId);
    }
    if (type) {
      filters.push("t.type=?");
      params.push(type);
    }
    if (customerId) {
      filters.push("a.customer_id=?");
      params.push(customerId);
    }
    const items = await this.db.query(
      `SELECT t.id, t.type,
        CASE WHEN c.status='anonymized' THEN 'Cliente anonimizado' ELSE c.name END AS customerName,
        a.card_code AS cardCode, t.amount, p.name AS programName,
        s.name AS staffName, b.name AS branchName, t.created_at AS createdAt
      FROM loyalty_transactions t FORCE INDEX (ix_transactions_business_created)
      JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id
      LEFT JOIN customers c ON c.id=a.customer_id AND c.business_id=a.business_id
      JOIN programs p ON p.id=t.program_id AND p.business_id=t.business_id
      JOIN staff_users s ON s.id=t.actor_id AND s.business_id=t.business_id
      JOIN branches b ON b.id=t.branch_id AND b.business_id=t.business_id
      WHERE ${filters.join(" AND ")}
      ORDER BY t.created_at DESC, t.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    return items.map((item: any) => {
      const { cardCode, ...safe } = item;
      return {
        ...safe,
        customerName: item.customerName ?? null,
        maskedCard: `••••${String(cardCode).slice(-4)}`,
        amount: Number(item.amount),
        createdAt: new Date(item.createdAt).toISOString(),
      };
    });
  }

  async activityCount(
    start: Date,
    end: Date,
    branchId?: string,
    staffId?: string,
    type?: string,
  ) {
    const { businessId } = this.scope;
    const branches = this.branches(branchId);
    const filters = ["business_id=?", "created_at>=?", "created_at<?"];
    const params: unknown[] = [businessId, start, end];
    if (branches !== null) {
      if (!branches.length) filters.push("1=0");
      else {
        filters.push(`branch_id IN (${branches.map(() => "?").join(",")})`);
        params.push(...branches);
      }
    }
    if (staffId) {
      filters.push("actor_id=?");
      params.push(staffId);
    }
    if (type) {
      filters.push("type=?");
      params.push(type);
    }
    const [row] = await this.db.query(
      `SELECT COUNT(*) AS total FROM loyalty_transactions WHERE ${filters.join(" AND ")}`,
      params,
    );
    return Number(row.total);
  }

  async redemptions(
    start: Date,
    end: Date,
    branchId: string | undefined,
    limit: number,
    offset: number,
  ) {
    const { businessId } = this.scope;
    const branches = this.branches(branchId);
    const branchFilterSql = branchFilter("t.branch_id", branches);
    const params = [businessId, start, end, ...(branches ?? [])];
    const rows = await this.db.query(
      `SELECT STRAIGHT_JOIN r.id,
        CASE WHEN c.status='anonymized' THEN 'Cliente anonimizado' ELSE c.name END AS customerName,
        a.card_code AS cardCode, w.name AS rewardName, ABS(t.amount) AS cost, r.status,
        b.name AS branchName, s.name AS staffName, r.created_at AS createdAt
      FROM redemptions r FORCE INDEX (ix_redemptions_business_created)
      JOIN loyalty_accounts a ON a.id=r.account_id AND a.business_id=r.business_id
      LEFT JOIN customers c ON c.id=a.customer_id AND c.business_id=a.business_id
      JOIN rewards w ON w.id=r.reward_id AND w.business_id=r.business_id
      JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id
      JOIN branches b ON b.id=t.branch_id AND b.business_id=t.business_id
      JOIN staff_users s ON s.id=t.actor_id AND s.business_id=t.business_id
      WHERE r.business_id=? AND r.created_at>=? AND r.created_at<?${branchFilterSql}
      ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const [count] = await this.db.query(
      branches === null
        ? `SELECT COUNT(*) AS total FROM redemptions r
          WHERE r.business_id=? AND r.created_at>=? AND r.created_at<?`
        : `SELECT COUNT(*) AS total
          FROM redemptions r
          JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id
          WHERE r.business_id=? AND r.created_at>=? AND r.created_at<?${branchFilterSql}`,
      params,
    );
    return {
      items: rows.map((row: any) => {
        const { cardCode, ...safe } = row;
        return {
          ...safe,
          maskedCard: `••••${String(cardCode).slice(-4)}`,
          cost: Number(row.cost),
          createdAt: new Date(row.createdAt).toISOString(),
        };
      }),
      total: Number(count.total),
    };
  }

  async customers(search: string | undefined, limit: number, offset: number) {
    const { businessId } = this.scope;
    const branches = this.scope.branchIds;
    const args: unknown[] = [businessId];
    let searchSql = "";
    if (search?.trim()) {
      const escaped = search.trim().replace(/[\\%_]/g, "\\$&");
      searchSql =
        " AND c.status='active' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)";
      args.push(`%${escaped}%`, `%${escaped}%`, `%${escaped}%`);
    }
    const branchSql =
      branches === null
        ? ""
        : branches.length
          ? ` AND EXISTS (
              SELECT 1 FROM loyalty_transactions bt
              WHERE bt.business_id=c.business_id
                AND bt.branch_id IN (${branches.map(() => "?").join(",")})
                AND bt.account_id IN (
                  SELECT ba.id FROM loyalty_accounts ba
                  WHERE ba.business_id=c.business_id AND ba.customer_id=c.id
                )
            )`
          : " AND 1=0";
    const branchParams = branches ?? [];
    const rows = await this.db.query(
      `SELECT c.id, c.name, c.email, c.phone, c.status,
        COALESCE(consent.status='granted',0) AS marketingConsent,
        IF(SUM(a.status='active')>0,'active',IF(COUNT(a.id)>0,'disabled','none')) AS cardStatus,
        IF(COUNT(a.id)=0,NULL,SUM(a.balance)) AS balance,
        MAX(visits.lastVisitAt) AS lastVisitAt
      FROM customers c
      LEFT JOIN loyalty_accounts a ON a.business_id=c.business_id AND a.customer_id=c.id
      LEFT JOIN (
        SELECT customer_id, status,
          ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC,id DESC) AS rank_no
        FROM consents WHERE business_id=? AND purpose='marketing'
      ) consent ON consent.customer_id=c.id AND consent.rank_no=1
      LEFT JOIN (
        SELECT t.account_id, MAX(t.created_at) AS lastVisitAt
        FROM loyalty_transactions t
        WHERE t.business_id=? AND t.type='accumulate'
          AND NOT EXISTS (
            SELECT 1 FROM loyalty_transactions r
            WHERE r.business_id=t.business_id AND r.reverses_transaction_id=t.id
          )
        GROUP BY t.account_id
      ) visits ON visits.account_id=a.id
      WHERE c.business_id=?${searchSql}${branchSql}
      GROUP BY c.id, consent.status
      ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?`,
      [businessId, businessId, ...args, ...branchParams, limit, offset],
    );
    const count = await this.db.query(
      `SELECT COUNT(*) AS total FROM customers c WHERE c.business_id=?${searchSql}${branchSql}`,
      [businessId, ...args.slice(1), ...branchParams],
    );
    return {
      items: rows.map((r: any) => ({
        ...r,
        name: r.status === "anonymized" ? "Cliente anonimizado" : r.name,
        email: r.status === "anonymized" ? null : r.email,
        phone: r.status === "anonymized" ? null : r.phone,
        marketingConsent: Boolean(r.marketingConsent),
        balance: r.balance === null ? null : Number(r.balance),
        lastVisitAt: r.lastVisitAt
          ? new Date(r.lastVisitAt).toISOString()
          : null,
      })),
      total: Number(count[0].total),
    };
  }

  async customerDetail(id: string) {
    const { businessId } = this.scope;
    const [customer] = await this.db.query(
      "SELECT id,name,email,phone,status FROM customers WHERE business_id=? AND id=?",
      [businessId, id],
    );
    if (!customer) return null;
    const accounts = await this.db.query(
      `SELECT a.id, p.name AS programName, p.mode, a.balance, a.status
      FROM loyalty_accounts a
      JOIN programs p ON p.id=a.program_id AND p.business_id=a.business_id
      WHERE a.business_id=? AND a.customer_id=?
      ORDER BY a.created_at DESC, a.id DESC`,
      [businessId, id],
    );
    const movements = await this.activity(
      new Date("1970-01-01T00:00:00Z"),
      new Date("9999-12-31T00:00:00Z"),
      100,
      0,
      undefined,
      undefined,
      undefined,
      id,
    );
    const [consent] = await this.db.query(
      `SELECT status FROM consents
      WHERE business_id=? AND customer_id=? AND purpose='marketing'
      ORDER BY created_at DESC, id DESC LIMIT 1`,
      [businessId, id],
    );
    const [lastVisit] = await this.db.query(
      `SELECT MAX(t.created_at) AS lastVisitAt
      FROM loyalty_transactions t
      JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id
      WHERE t.business_id=? AND a.customer_id=? AND t.type='accumulate'
        AND NOT EXISTS (
          SELECT 1 FROM loyalty_transactions r
          WHERE r.business_id=t.business_id AND r.reverses_transaction_id=t.id
        )`,
      [businessId, id],
    );
    return {
      customer: {
        ...customer,
        name:
          customer.status === "anonymized"
            ? "Cliente anonimizado"
            : customer.name,
        email: customer.status === "anonymized" ? null : customer.email,
        phone: customer.status === "anonymized" ? null : customer.phone,
        marketingConsent: consent?.status === "granted",
        cardStatus: accounts.some((a: any) => a.status === "active")
          ? "active"
          : accounts.length
            ? "disabled"
            : "none",
        balance: accounts.length
          ? accounts.reduce((sum: number, a: any) => sum + Number(a.balance), 0)
          : null,
        lastVisitAt: lastVisit?.lastVisitAt
          ? new Date(lastVisit.lastVisitAt).toISOString()
          : null,
      },
      accounts: accounts.map((a: any) => ({
        ...a,
        balance: Number(a.balance),
      })),
      movements,
    };
  }

  async options(table: "branches" | "staff_users") {
    const { businessId, branchIds } = this.scope;
    if (table === "branches") {
      const filter =
        branchIds === null
          ? ""
          : branchIds.length
            ? ` AND id IN (${branchIds.map(() => "?").join(",")})`
            : " AND 1=0";
      return this.db.query(
        `SELECT id,name FROM branches WHERE business_id=?${filter} ORDER BY name,id`,
        [businessId, ...(branchIds ?? [])],
      );
    }
    const staffFilter =
      branchIds === null
        ? ""
        : branchIds.length
          ? " AND branch_ids IS NOT NULL AND JSON_OVERLAPS(branch_ids, CAST(? AS JSON))"
          : " AND 1=0";
    return this.db.query(
      `SELECT id,name FROM staff_users WHERE business_id=? AND is_active=1${staffFilter} ORDER BY name,id`,
      [businessId, ...(branchIds?.length ? [JSON.stringify(branchIds)] : [])],
    );
  }

  async metricCounts(start: Date, end: Date, branchId?: string) {
    const { businessId } = this.scope;
    const branches = this.branches(branchId);
    const branchSql = branchFilter("t.branch_id", branches);
    const params = [businessId, start, end, ...(branches ?? [])];
    const customerBranch =
      branches === null
        ? ""
        : branches.length
          ? ` AND EXISTS (
              SELECT 1 FROM loyalty_accounts ca
              JOIN loyalty_transactions ct ON ct.account_id=ca.id AND ct.business_id=ca.business_id
              WHERE ca.business_id=customers.business_id AND ca.customer_id=customers.id
                AND ct.branch_id IN (${branches.map(() => "?").join(",")})
            )`
          : " AND 1=0";
    const passBranch =
      branches === null
        ? ""
        : branches.length
          ? ` AND EXISTS (
              SELECT 1 FROM loyalty_transactions pt
              WHERE pt.business_id=wallet_passes.business_id
                AND pt.account_id=wallet_passes.account_id
                AND pt.branch_id IN (${branches.map(() => "?").join(",")})
            )`
          : " AND 1=0";
    const [
      registeredRows,
      issuedRows,
      customerActivityRows,
      redemptionRows,
      rewardRows,
      openingBalances,
      periodLedger,
    ] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*) AS total FROM customers FORCE INDEX (ix_customers_business_created)
      WHERE business_id=? AND created_at>=? AND created_at<?${customerBranch}`,
        [businessId, start, end, ...(branches ?? [])],
      ),
      this.db.query(
        `SELECT COUNT(*) AS total FROM wallet_passes FORCE INDEX (ix_wallet_passes_business_created)
      WHERE business_id=? AND created_at>=? AND created_at<?${passBranch}`,
        [businessId, start, end, ...(branches ?? [])],
      ),
      this.db.query(
        `SELECT COUNT(*) AS active, SUM(accumulations>=2) AS repeatCustomers
      FROM (
        SELECT a.customer_id, SUM(t.type='accumulate') AS accumulations
        FROM loyalty_transactions t FORCE INDEX (ix_transactions_metrics_period)
      JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id
      LEFT JOIN loyalty_transactions r FORCE INDEX (ix_transactions_reversal_business)
        ON r.business_id=t.business_id AND r.reverses_transaction_id=t.id
      WHERE t.business_id=? AND t.created_at>=? AND t.created_at<?
        AND t.type IN ('accumulate','redeem','adjust') AND a.customer_id IS NOT NULL${branchSql}
        AND r.id IS NULL
        GROUP BY a.customer_id
      ) customer_activity`,
        params,
      ),
      this.db.query(
        `SELECT COUNT(*) AS total
        FROM redemptions r FORCE INDEX (ix_redemptions_business_created)
      JOIN loyalty_transactions t ON t.id=r.transaction_id AND t.business_id=r.business_id
      WHERE r.business_id=? AND r.created_at>=? AND r.created_at<?
        AND r.status='completed'${branchSql}`,
        params,
      ),
      this.db.query(
        "SELECT program_id,MIN(cost) AS cost FROM rewards WHERE business_id=? AND is_active=1 GROUP BY program_id",
        [businessId],
      ),
      this.db.query(
        `SELECT account_id,SUM(amount) AS balance FROM loyalty_transactions
        FORCE INDEX (ix_transactions_eligibility_period)
        WHERE business_id=? AND created_at<? GROUP BY account_id`,
        [businessId, start],
      ),
      this.db.query(
        `SELECT account_id,program_id,branch_id,created_at,id,amount FROM loyalty_transactions
        FORCE INDEX (ix_transactions_eligibility_period)
        WHERE business_id=? AND created_at>=? AND created_at<?
        ORDER BY account_id,created_at,id`,
        [businessId, start, end],
      ),
    ]);
    const balances = new Map<string, number>(
      openingBalances.map((row: any) => [row.account_id, Number(row.balance)]),
    );
    const rewardCosts = new Map<string, number>(
      rewardRows.map((row: any) => [row.program_id, Number(row.cost)]),
    );
    const visibleBranches = branches === null ? null : new Set(branches);
    let eligibleEvents = 0;
    for (const row of periodLedger as any[]) {
      const before = balances.get(row.account_id) ?? 0;
      const after = before + Number(row.amount);
      const cost = rewardCosts.get(row.program_id);
      if (
        cost !== undefined &&
        before < cost &&
        after >= cost &&
        (visibleBranches === null || visibleBranches.has(row.branch_id))
      )
        eligibleEvents++;
      balances.set(row.account_id, after);
    }
    const registered = registeredRows[0];
    const issued = issuedRows[0];
    const active = customerActivityRows[0].active;
    const repeat = customerActivityRows[0].repeatCustomers;
    const redemptions = redemptionRows[0];
    return {
      registrations: Number(registered.total),
      issuedPasses: Number(issued.total),
      activeCustomers: Number(active),
      repeatCustomers: Number(repeat),
      redemptions: Number(redemptions.total),
      eligibleEvents,
      activeCustomersCount: Number(active),
      branchId,
    };
  }

  customerCsvStream(): Readable {
    const businessId = this.scope.businessId;
    const queryRunner = this.db.createQueryRunner();
    return Readable.from(
      (async function* () {
        await queryRunner.connect();
        try {
          const rows = await queryRunner.stream(
            `SELECT CASE WHEN c.status='anonymized'
                THEN 'Cliente anonimizado' ELSE c.name END AS name,
              c.email, c.phone, c.status,
              COALESCE(consent.status='granted',0) AS marketingConsent
            FROM customers c
            LEFT JOIN (
              SELECT customer_id, status,
                ROW_NUMBER() OVER (
                  PARTITION BY customer_id ORDER BY created_at DESC, id DESC
                ) AS rank_no
              FROM consents WHERE business_id=? AND purpose='marketing'
            ) consent ON consent.customer_id=c.id AND consent.rank_no=1
            WHERE c.business_id=? ORDER BY c.created_at DESC, c.id DESC`,
            [businessId, businessId],
          );
          yield "\uFEFF" +
            csvRow([
              "Nombre",
              "Correo",
              "Teléfono",
              "Estado",
              "Consentimiento de marketing",
            ]);
          for await (const row of rows)
            yield csvRow([
              row.name === "Cliente anonimizado"
                ? "Cliente anonimizado"
                : row.name,
              row.status === "anonymized" ? null : row.email,
              row.status === "anonymized" ? null : row.phone,
              row.status,
              Boolean(row.marketingConsent) ? "Sí" : "No",
            ]);
        } finally {
          await queryRunner.release();
        }
      })(),
    );
  }

  movementCsvStream(start: Date, end: Date, branchId?: string): Readable {
    const { businessId } = this.scope;
    const branches = this.branches(branchId);
    const branchFilterSql = branchFilter("t.branch_id", branches);
    const params = [businessId, start, end, ...(branches ?? [])];
    const queryRunner = this.db.createQueryRunner();
    return Readable.from(
      (async function* () {
        await queryRunner.connect();
        try {
          const rows = await queryRunner.stream(
            `SELECT STRAIGHT_JOIN t.type,
              CASE WHEN c.status='anonymized'
                THEN 'Cliente anonimizado' ELSE c.name END AS customerName,
              a.card_code AS cardCode, t.amount, p.name AS programName,
              s.name AS staffName, b.name AS branchName, t.created_at AS createdAt
            FROM loyalty_transactions t FORCE INDEX (ix_transactions_business_created)
            JOIN loyalty_accounts a ON a.id=t.account_id AND a.business_id=t.business_id
            LEFT JOIN customers c ON c.id=a.customer_id AND c.business_id=a.business_id
            JOIN programs p ON p.id=t.program_id AND p.business_id=t.business_id
            JOIN staff_users s ON s.id=t.actor_id AND s.business_id=t.business_id
            JOIN branches b ON b.id=t.branch_id AND b.business_id=t.business_id
            WHERE t.business_id=? AND t.created_at>=? AND t.created_at<?${branchFilterSql}
            ORDER BY t.created_at DESC, t.id DESC`,
            params,
          );
          yield "\uFEFF" +
            csvRow([
              "Fecha",
              "Tipo",
              "Cliente",
              "Tarjeta",
              "Importe",
              "Programa",
              "Empleado",
              "Sucursal",
            ]);
          for await (const row of rows)
            yield csvRow([
              new Date(row.createdAt).toISOString(),
              row.type,
              row.customerName ?? "",
              `••••${String(row.cardCode).slice(-4)}`,
              Number(row.amount),
              row.programName,
              row.staffName,
              row.branchName,
            ]);
        } finally {
          await queryRunner.release();
        }
      })(),
    );
  }
}
