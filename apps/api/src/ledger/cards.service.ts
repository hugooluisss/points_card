import { Injectable, NotFoundException } from "@nestjs/common";
import { LedgerRepository } from "./ledger.repository";
import { ledgerStrategy } from "./strategy.factory";
import { cardState } from "./card-state";

@Injectable()
export class CardsService {
  constructor(private readonly ledger: LedgerRepository) {}

  async card(cardCode: string) {
    const account = await this.ledger.accountByCode(cardCode);
    if (!account || account.status !== "active")
      throw new NotFoundException("Tarjeta no encontrada.");
    const program = await this.ledger.program(account.programId);
    if (!program) throw new NotFoundException("Programa no encontrado.");
    const rewards = await this.ledger.activeRewards(program.id);
    const state = cardState(
      program.mode,
      account.balance,
      program.stampsGoal,
      rewards.map(({ cost }) => cost),
    );
    return {
      accountId: account.id,
      cardCode: account.cardCode,
      balance: account.balance,
      ...state,
      rewards: rewards.map(({ id, name, cost }) => ({
        id,
        name,
        cost,
        affordable: ledgerStrategy(program).canRedeem(account.balance, cost),
      })),
    };
  }
}
