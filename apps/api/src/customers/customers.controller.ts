import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@points-card/shared";
import { Audit } from "../audit/audit.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CustomersService } from "./customers.service";
import { DashboardCustomersService } from "../dashboard/dashboard-customers.service";
import { CustomerQueryDto } from "../dashboard/dto/customer-query.dto";

@Controller("customers")
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(
    private readonly customers: CustomersService,
    private readonly dashboardCustomers: DashboardCustomersService,
  ) {}
  @Get() list(@Query() query: CustomerQueryDto) {
    return this.dashboardCustomers.list(
      query.search,
      query.page,
      query.pageSize,
    );
  }
  @Get(":id/detail") detail(@Param("id") id: string) {
    return this.dashboardCustomers.detail(id);
  }
  @Get(":id/data-export")
  @Roles(Role.Owner, Role.Manager)
  @Audit("customer.data_export")
  exportData(@Param("id") id: string) {
    return this.customers.exportData(id);
  }
  @Post(":id/anonymize")
  @Roles(Role.Owner, Role.Manager)
  @Audit("customer.anonymize")
  anonymize(@Param("id") id: string) {
    return this.customers.anonymize(id);
  }
  @Post(":id/marketing-consent/revoke")
  @Roles(Role.Owner, Role.Manager)
  @Audit("customer.marketing_revoke")
  revokeMarketing(@Param("id") id: string) {
    return this.customers.revokeMarketing(id);
  }
  @Get(":id/consents") @Roles(Role.Owner, Role.Manager) getConsents(
    @Param("id") id: string,
  ) {
    return this.customers.consentsHistory(id);
  }
}
