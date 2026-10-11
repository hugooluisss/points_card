import { Injectable, NotFoundException } from "@nestjs/common";
import { LedgerRepository } from "./ledger.repository";

@Injectable()
export class AccountsService {
  constructor(private readonly ledger: LedgerRepository) {}

  async createAccount(programId: string) {
    // Temporary F2 fixture endpoint; F3 customer onboarding replaces manual account creation.
    const account = await this.ledger.createAccount(programId);
    if (!account) throw new NotFoundException("Programa no encontrado.");
    return account;
  }
}
