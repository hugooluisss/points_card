import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClockModule } from "../ledger/clock.module";
import { RolesGuard } from "../auth/roles.guard";
import { DashboardController } from "./dashboard.controller";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardSummaryService } from "./dashboard-summary.service";
import { DashboardMetricsService } from "./dashboard-metrics.service";
import { DashboardCustomersService } from "./dashboard-customers.service";
import { DashboardMovementsService } from "./dashboard-movements.service";
import { DashboardRedemptionsService } from "./dashboard-redemptions.service";
import { DashboardOptionsService } from "./dashboard-options.service";
import { DashboardExportService } from "./dashboard-export.service";

@Module({
  imports: [TypeOrmModule.forFeature([]), ClockModule],
  controllers: [DashboardController],
  providers: [
    RolesGuard,
    DashboardRepository,
    DashboardSummaryService,
    DashboardMetricsService,
    DashboardCustomersService,
    DashboardMovementsService,
    DashboardRedemptionsService,
    DashboardOptionsService,
    DashboardExportService,
  ],
  exports: [DashboardCustomersService],
})
export class DashboardModule {}
