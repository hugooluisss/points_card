import { Injectable, NotFoundException } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";

@Injectable()
export class DashboardCustomersService {
  constructor(private readonly repository: DashboardRepository) {}

  list(search: string | undefined, page: number, pageSize: number) {
    return this.repository
      .customers(search, pageSize, (page - 1) * pageSize)
      .then((result) => ({ ...result, page, pageSize }));
  }

  async detail(id: string) {
    const detail = await this.repository.customerDetail(id);
    if (!detail) throw new NotFoundException("Cliente no encontrado.");
    return detail;
  }
}
