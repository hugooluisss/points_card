import { Injectable } from "@nestjs/common";
import { DashboardPeriod, DashboardSummaryDto } from "@points-card/shared";
import { Clock } from "../ledger/clock";
import { DashboardRepository } from "./dashboard.repository";
import { dashboardPeriod } from "./dashboard-period";
import { businessDate } from "../ledger/business-day";

@Injectable()
export class DashboardSummaryService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly clock: Clock,
  ) {}

  async get(
    period: DashboardPeriod,
    branchId?: string,
  ): Promise<DashboardSummaryDto> {
    const bounds = dashboardPeriod(
      period,
      this.clock.now(),
      process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City",
    );
    const result = await this.repository.summary(
      bounds.start,
      bounds.end,
      bounds.previousStart,
      bounds.previousEnd,
      branchId,
    );
    const value = (rows: any[]) => Number(rows[0]?.total ?? 0);
    const byDate = new Map<string, number>();
    for (const row of result.byDay as any[]) {
      const date = businessDate(
        new Date(row.created_at),
        process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City",
      );
      byDate.set(date, (byDate.get(date) ?? 0) + Number(row.count));
    }
    return {
      period,
      kpis: {
        registeredCustomers: {
          value: value(result.customerRows),
          previous: value(result.prevCustomerRows),
        },
        issuedPasses: {
          value: value(result.passRows),
          previous: value(result.prevPassRows),
        },
        operations: {
          value: value(result.operationRows),
          previous: value(result.prevOperationRows),
        },
        redemptions: {
          value: value(result.redemptionRows),
          previous: value(result.prevRedemptionRows),
        },
      },
      savedPassesAvailable: false,
      operationsPerDay: bounds.dates.map((date) => ({
        date,
        count: byDate.get(date) ?? 0,
      })),
      recent: result.recent,
    } as DashboardSummaryDto;
  }
}
