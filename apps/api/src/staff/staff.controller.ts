import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Role } from "@points-card/shared";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UseGuards } from "@nestjs/common";
import { StaffService } from "./staff.service";
import { Audit } from "../audit/audit.decorator";

class CreateStaffBody {
  @IsString() @MinLength(1) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsEnum(Role) role!: Role;
  @IsOptional() @IsArray() @IsString({ each: true }) branchIds?:
    string[] | null;
}
class RoleBody {
  @IsEnum(Role) role!: Role;
}
@Controller("staff")
@UseGuards(RolesGuard)
@Roles(Role.Owner)
export class StaffController {
  constructor(private readonly staff: StaffService) {}
  @Get() list() {
    return this.staff.list();
  }
  @Post() @Audit("staff.create") create(@Body() body: CreateStaffBody) {
    return this.staff.create({ ...body, branchIds: body.branchIds ?? null });
  }
  @Patch(":id/disable") @Audit("staff.disable") disable(
    @Param("id") id: string,
  ) {
    return this.staff.setActive(id, false);
  }
  @Patch(":id/enable") @Audit("staff.enable") enable(@Param("id") id: string) {
    return this.staff.setActive(id, true);
  }
  @Patch(":id/role") @Audit("staff.role_change") changeRole(
    @Param("id") id: string,
    @Body() body: RoleBody,
  ) {
    return this.staff.setRole(id, body.role);
  }
}
