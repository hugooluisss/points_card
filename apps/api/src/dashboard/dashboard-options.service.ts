import { Injectable } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";

@Injectable()
export class DashboardOptionsService {
  constructor(private readonly repository: DashboardRepository) {}
  branches() {
    return this.repository.options("branches");
  }
  staff() {
    return this.repository.options("staff_users");
  }
}
