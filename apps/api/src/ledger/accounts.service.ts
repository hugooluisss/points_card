import { Injectable, NotFoundException } from "@nestjs/common";
import { LedgerRepository } from "./ledger.repository";
import { PlanLimitsService } from "../billing/plan-limits.service";

@Injectable()
export class AccountsService {
  constructor(
    private readonly ledger: LedgerRepository,
    private readonly limits: PlanLimitsService,
  ) {}

  async createAccount(programId: string) {
    await this.limits.assertCanCreate("cards");
    // Temporary F2 fixture endpoint; F3 customer onboarding replaces manual account creation.
    const account = await this.ledger.createAccount(programId);
    if (!account) throw new NotFoundException("Programa no encontrado.");
    return account;
  }
}
