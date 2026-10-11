import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthUser } from "@points-card/shared";
import { assertBranchAccess } from "../auth/branch-access";
import { LedgerRepository } from "./ledger.repository";
import { LedgerSupportService } from "./ledger-support.service";

type AdjustmentInput = {
  cardCode: string;
  branchId?: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
};
type ReverseInput = { reason: string; idempotencyKey: string };

@Injectable()
export class AdjustmentService {
  constructor(
    private readonly ledger: LedgerRepository,
    private readonly support: LedgerSupportService,
  ) {}

  async adjust(user: AuthUser, input: AdjustmentInput) {
    const branchId = await this.support.branchForOperation(
      user,
      input.branchId,
    );
    return this.ledger.idempotent(
      input.idempotencyKey,
      { type: "adjust", cardCode: input.cardCode, amount: input.amount },
      async (manager) => {
        const account = await this.ledger.accountForUpdate(
          manager,
          input.cardCode,
        );
        if (!account || account.status !== "active")
          throw new NotFoundException("Tarjeta no encontrada.");
        const next = account.balance + input.amount;
        if (next < 0)
          throw new ConflictException(
            "El ajuste dejaría el saldo en negativo.",
          );
        const transaction = await this.ledger.insertTransaction(manager, {
          branchId,
          accountId: account.id,
          programId: account.programId,
          type: "adjust",
          amount: input.amount,
          reason: input.reason,
          actorId: user.id,
          idempotencyKey: input.idempotencyKey,
        });
        await this.ledger.saveAccount(manager, account, next);
        return { transaction };
      },
    );
  }

  async reverse(user: AuthUser, transactionId: string, input: ReverseInput) {
    if (!input.reason || input.reason.trim().length < 5)
      throw new BadRequestException(
        "El motivo debe tener al menos 5 caracteres.",
      );
    return this.ledger.idempotent(
      input.idempotencyKey,
      { type: "reverse", reversesTransactionId: transactionId },
      async (manager) => {
        const original = await this.ledger.transaction(manager, transactionId);
        if (!original) throw new NotFoundException("Movimiento no encontrado.");
        if (original.type === "reverse")
          throw new ConflictException("No se puede revertir un reverso.");
        assertBranchAccess(user, original.branchId);
        const account = await this.ledger.lockedAccount(
          manager,
          original.accountId,
        );
        if (!account) throw new NotFoundException("Tarjeta no encontrada.");
        if (await this.ledger.reversed(manager, original.id))
          throw new ConflictException("Este movimiento ya fue revertido.");
        const next = account.balance - original.amount;
        if (next < 0)
          throw new ConflictException(
            "El reverso dejaría el saldo en negativo.",
          );
        const transaction = await this.ledger.insertTransaction(manager, {
          branchId: original.branchId,
          accountId: account.id,
          programId: original.programId,
          type: "reverse",
          amount: -original.amount,
          reason: input.reason,
          reversesTransactionId: original.id,
          actorId: user.id,
          idempotencyKey: input.idempotencyKey,
        });
        await this.ledger.saveAccount(manager, account, next);
        await this.ledger.markRedemptionReversed(manager, original.id);
        return { transaction };
      },
    );
  }
}
