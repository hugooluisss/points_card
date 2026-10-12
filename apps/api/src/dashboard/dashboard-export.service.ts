import { Injectable } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardMovementsService } from "./dashboard-movements.service";

@Injectable()
export class DashboardExportService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly dates: DashboardMovementsService,
  ) {}
  customers() {
    return this.repository.customerCsvStream();
  }
  movements(from: string, to: string, branchId?: string) {
    const [start, end] = this.dates.bounds(from, to);
    return this.repository.movementCsvStream(start, end, branchId);
  }
}
