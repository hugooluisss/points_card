import {
  Controller,
  Get,
  Header,
  Query,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@points-card/shared";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { DashboardMetricsService } from "./dashboard-metrics.service";
import { DashboardOptionsService } from "./dashboard-options.service";
import { DashboardRedemptionsService } from "./dashboard-redemptions.service";
import { DashboardMovementsService } from "./dashboard-movements.service";
import { DashboardSummaryService } from "./dashboard-summary.service";
import { DashboardSummaryQueryDto } from "./dto/dashboard-summary-query.dto";
import { MovementsQueryDto } from "./dto/movements-query.dto";
import { RedemptionsQueryDto } from "./dto/redemptions-query.dto";
import { DashboardExportService } from "./dashboard-export.service";
import { Audit } from "../audit/audit.decorator";

@Controller()
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(
    private readonly summary: DashboardSummaryService,
    private readonly metrics: DashboardMetricsService,
    private readonly movements: DashboardMovementsService,
    private readonly redemptions: DashboardRedemptionsService,
    private readonly options: DashboardOptionsService,
    private readonly exports: DashboardExportService,
  ) {}

  @Get("dashboard/summary") summaryData(
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.summary.get(query.period, query.branchId);
  }
  @Get("metrics") @Roles(Role.Owner, Role.Manager) metricsData(
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.metrics.get(query.period, query.branchId);
  }
  @Get("branches") branches() {
    return this.options.branches();
  }
  @Get("staff/options") staff() {
    return this.options.staff();
  }
  @Get("movements") movementList(@Query() query: MovementsQueryDto) {
    return this.movements.list(query);
  }
  @Get("redemptions") redemptionList(@Query() query: RedemptionsQueryDto) {
    return this.redemptions.list(query);
  }

  @Get("exports/customers.csv")
  @Roles(Role.Owner, Role.Manager)
  @Audit("dashboard.export_customers")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="clientes.csv"')
  exportCustomers() {
    return new StreamableFile(this.exports.customers());
  }

  @Get("exports/movements.csv")
  @Roles(Role.Owner, Role.Manager)
  @Audit("dashboard.export_movements")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="movimientos.csv"')
  exportMovements(@Query() query: MovementsQueryDto) {
    return new StreamableFile(
      this.exports.movements(query.from, query.to, query.branchId),
    );
  }
}
