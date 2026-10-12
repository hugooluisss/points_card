import { Injectable } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardMovementsService } from "./dashboard-movements.service";

@Injectable()
export class DashboardRedemptionsService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly dates: DashboardMovementsService,
  ) {}

  async list(input: {
    from: string;
    to: string;
    branchId?: string;
    page: number;
    pageSize: number;
  }) {
    const [start, end] = this.dates.bounds(input.from, input.to);
    const result = await this.repository.redemptions(
      start,
      end,
      input.branchId,
      input.pageSize,
      (input.page - 1) * input.pageSize,
    );
    return { ...result, page: input.page, pageSize: input.pageSize };
  }
}
