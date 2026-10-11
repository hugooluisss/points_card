import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@points-card/shared";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { Audit } from "../audit/audit.decorator";
import { ProgramsService } from "./programs.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
@Controller("programs")
@UseGuards(RolesGuard)
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}
  @Get() @Roles(Role.Owner, Role.Manager, Role.Cashier) list() {
    return this.programs.list();
  }
  @Get(":id") @Roles(Role.Owner, Role.Manager, Role.Cashier) get(
    @Param("id") id: string,
  ) {
    return this.programs.get(id);
  }
  @Post() @Roles(Role.Owner, Role.Manager) @Audit("program.create") create(
    @Body() body: CreateProgramDto,
  ) {
    return this.programs.create(body);
  }
  @Patch(":id")
  @Roles(Role.Owner, Role.Manager)
  @Audit("program.update")
  update(@Param("id") id: string, @Body() body: UpdateProgramDto) {
    return this.programs.update(id, body);
  }
  @Patch(":id/activate")
  @Roles(Role.Owner, Role.Manager)
  @Audit("program.activate")
  activate(@Param("id") id: string) {
    return this.programs.setStatus(id, "active");
  }
  @Patch(":id/deactivate")
  @Roles(Role.Owner, Role.Manager)
  @Audit("program.deactivate")
  deactivate(@Param("id") id: string) {
    return this.programs.setStatus(id, "inactive");
  }
}
