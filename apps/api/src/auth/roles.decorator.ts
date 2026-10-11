import { SetMetadata } from "@nestjs/common";
import { Role } from "@points-card/shared";
export const ROLES = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);
