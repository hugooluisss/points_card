import { Injectable } from "@nestjs/common";
import { DashboardPeriod, MetricsDto } from "@points-card/shared";
import { Clock } from "../ledger/clock";
import { DashboardRepository } from "./dashboard.repository";
import { dashboardPeriod } from "./dashboard-period";

@Injectable()
export class DashboardMetricsService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly clock: Clock,
  ) {}

  async get(period: DashboardPeriod, branchId?: string): Promise<MetricsDto> {
    const bounds = dashboardPeriod(
      period,
      this.clock.now(),
      process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City",
    );
    const data = await this.repository.metricCounts(
      bounds.start,
      bounds.end,
      branchId,
    );
    // Altas = clientes creados; emitidos = pases creados. Guardados no se confirma en F0.
    // Activos = clientes con operación válida; repetición = clientes con 2 acumulaciones válidas / activos.
    // Canje = canjes completados / transiciones de saldo al costo mínimo activo del catálogo actual.
    return {
      registrations: data.registrations,
      activeCustomers: data.activeCustomers,
      repeatVisitRate: data.activeCustomersCount
        ? data.repeatCustomers / data.activeCustomersCount
        : 0,
      redemptionRate: data.eligibleEvents
        ? data.redemptions / data.eligibleEvents
        : 0,
      issuedPasses: data.issuedPasses,
      savedPasses: null,
    };
  }
}
