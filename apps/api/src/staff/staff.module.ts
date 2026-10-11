import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaffUser } from "./entities/staff-user.entity";
import { Branch } from "../branches/entities/branch.entity";
import { StaffRepository } from "./staff.repository";
import { StaffService } from "./staff.service";
import { StaffController } from "./staff.controller";
import { RolesGuard } from "../auth/roles.guard";
@Module({
  imports: [TypeOrmModule.forFeature([StaffUser, Branch])],
  controllers: [StaffController],
  providers: [StaffRepository, StaffService, RolesGuard],
})
export class StaffModule {}
