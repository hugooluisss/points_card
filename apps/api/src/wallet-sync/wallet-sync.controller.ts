import { Controller, Get, Param, Post } from "@nestjs/common";
import { Role } from "@points-card/shared";
import { Roles } from "../auth/roles.decorator";
import { Audit } from "../audit/audit.decorator";
import { WalletSyncService } from "./wallet-sync.service";

@Controller("wallet-sync")
export class WalletSyncController {
  constructor(private readonly service: WalletSyncService) {}
  @Get("failed") @Roles(Role.Owner, Role.Manager) failed() {
    return this.service.failed();
  }
  @Post(":id/retry")
  @Roles(Role.Owner, Role.Manager)
  @Audit("wallet_sync.retry")
  retry(@Param("id") id: string) {
    return this.service.retry(id);
  }
}
