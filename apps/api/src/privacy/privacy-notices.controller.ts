import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Role } from "@points-card/shared";
import { Audit } from "../audit/audit.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreatePrivacyNoticeDto } from "./create-privacy-notice.dto";
import { PrivacyNoticesService } from "./privacy-notices.service";

@Controller("privacy-notices")
@UseGuards(RolesGuard)
export class PrivacyNoticesController {
  constructor(private readonly notices: PrivacyNoticesService) {}
  @Post()
  @Roles(Role.Owner, Role.Manager)
  @Audit("privacy_notice.create")
  create(@Body() body: CreatePrivacyNoticeDto) {
    return this.notices.create(body.text);
  }
  @Get("current") @Roles(Role.Owner, Role.Manager, Role.Cashier) current() {
    return this.notices.current();
  }
  @Get() @Roles(Role.Owner, Role.Manager, Role.Cashier) list() {
    return this.notices.list();
  }
}
