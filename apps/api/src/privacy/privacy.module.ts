import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard";
import { PrivacyNotice } from "./entities/privacy-notice.entity";
import { PrivacyNoticesController } from "./privacy-notices.controller";
import { PrivacyNoticesRepository } from "./privacy-notices.repository";
import { PrivacyNoticesService } from "./privacy-notices.service";

@Module({
  imports: [TypeOrmModule.forFeature([PrivacyNotice])],
  controllers: [PrivacyNoticesController],
  providers: [PrivacyNoticesRepository, PrivacyNoticesService, RolesGuard],
  exports: [PrivacyNoticesService],
})
export class PrivacyModule {}
