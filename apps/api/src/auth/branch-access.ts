import { ForbiddenException } from "@nestjs/common";
import { AuthUser } from "@points-card/shared";
export function assertBranchAccess(user: AuthUser, branchId: string): void {
  if (user.branchIds !== null && !user.branchIds.includes(branchId))
    throw new ForbiddenException("No tienes acceso a esta sucursal.");
}
