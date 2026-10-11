import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthUser } from "@points-card/shared";
import { assertBranchAccess } from "../auth/branch-access";
import { LedgerRepository } from "./ledger.repository";

@Injectable()
export class LedgerSupportService {
  constructor(protected readonly ledger: LedgerRepository) {}

  async branchForOperation(user: AuthUser, requested?: string) {
    const branchId =
      requested ??
      (user.branchIds !== null
        ? user.branchIds?.[0]
        : await this.ledger.defaultBranchId());
    if (!branchId)
      throw new BadRequestException(
        "No hay una sucursal disponible para registrar la operación.",
      );
    assertBranchAccess(user, branchId);
    if (!(await this.ledger.hasBranch(branchId)))
      throw new NotFoundException("Sucursal no encontrada.");
    return branchId;
  }
}
