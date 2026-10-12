import { BadRequestException, Injectable } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";
import { dateBounds } from "./dashboard-period";

@Injectable()
export class DashboardMovementsService {
  constructor(private readonly repository: DashboardRepository) {}

  async list(input: {
    from: string;
    to: string;
    branchId?: string;
    staffId?: string;
    type?: string;
    page: number;
    pageSize: number;
  }) {
    const bounds = this.bounds(input.from, input.to);
    const [items, total] = await Promise.all([
      this.repository.activity(
        bounds[0],
        bounds[1],
        input.pageSize,
        (input.page - 1) * input.pageSize,
        input.branchId,
        input.staffId,
        input.type,
      ),
      this.repository.activityCount(
        bounds[0],
        bounds[1],
        input.branchId,
        input.staffId,
        input.type,
      ),
    ]);
    return { items, total, page: input.page, pageSize: input.pageSize };
  }

  bounds(from: string, to: string) {
    if (from > to)
      throw new BadRequestException(
        "La fecha inicial debe ser anterior o igual a la final.",
      );
    const start = new Date(`${from}T00:00:00Z`);
    const finish = new Date(`${to}T00:00:00Z`);
    if ((finish.getTime() - start.getTime()) / 86400000 > 366)
      throw new BadRequestException("El rango máximo es de 366 días.");
    return dateBounds(
      from,
      to,
      process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City",
    );
  }
}
