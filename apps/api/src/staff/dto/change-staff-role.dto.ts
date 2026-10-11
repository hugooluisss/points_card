import { IsEnum } from "class-validator";
import { Role } from "@points-card/shared";

export class RoleBody {
  @IsEnum(Role)
  role!: Role;
}
