import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthUser } from "@points-card/shared";
import { LedgerRepository } from "./ledger.repository";
import { LedgerSupportService } from "./ledger-support.service";
import { ledgerStrategy } from "./strategy.factory";

type RedemptionInput = {
  cardCode: string;
  branchId?: string;
  rewardId: string;
  idempotencyKey: string;
};

@Injectable()
export class RedemptionService {
  constructor(
    private readonly ledger: LedgerRepository,
    private readonly support: LedgerSupportService,
  ) {}

  async redeem(user: AuthUser, input: RedemptionInput) {
    const branchId = await this.support.branchForOperation(
      user,
      input.branchId,
    );
    const account = await this.ledger.accountByCode(input.cardCode);
    const program = account && (await this.ledger.program(account.programId));
    const reward =
      program && (await this.ledger.reward(input.rewardId, program.id));
    if (!account || !program || !reward)
      throw new NotFoundException("Recompensa activa no encontrada.");
    return this.ledger.idempotent(
      input.idempotencyKey,
      {
        type: "redeem",
        cardCode: input.cardCode,
        rewardId: input.rewardId,
        amount: -reward.cost,
      },
      async (manager) => {
        const locked = await this.ledger.accountForUpdate(
          manager,
          input.cardCode,
        );
        if (!locked || locked.status !== "active")
          throw new NotFoundException("Tarjeta no encontrada.");
        const currentProgram = await this.ledger.program(locked.programId);
        if (!currentProgram)
          throw new NotFoundException("Programa no encontrado.");
        const currentReward = await this.ledger.reward(
          input.rewardId,
          currentProgram.id,
        );
        if (!currentReward)
          throw new NotFoundException("Recompensa activa no encontrada.");
        if (
          !ledgerStrategy(currentProgram).canRedeem(
            locked.balance,
            currentReward.cost,
          )
        ) {
          throw new ConflictException(
            "Saldo insuficiente para canjear esta recompensa.",
          );
        }
        const transaction = await this.ledger.insertTransaction(manager, {
          branchId,
          accountId: locked.id,
          programId: currentProgram.id,
          rewardId: currentReward.id,
          type: "redeem",
          amount: -currentReward.cost,
          actorId: user.id,
          idempotencyKey: input.idempotencyKey,
        });
        await this.ledger.insertRedemption(manager, {
          accountId: locked.id,
          rewardId: currentReward.id,
          transactionId: transaction.id,
          status: "completed",
        });
        await this.ledger.saveAccount(
          manager,
          locked,
          locked.balance - currentReward.cost,
        );
        return { transaction };
      },
    );
  }
}
