import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuthUser } from "@points-card/shared";
import { Clock } from "./clock";
import { businessDate } from "./business-day";
import { LedgerRepository } from "./ledger.repository";
import { LedgerSupportService } from "./ledger-support.service";
import { ledgerStrategy } from "./strategy.factory";

type AccumulationInput = {
  cardCode: string;
  branchId?: string;
  idempotencyKey: string;
  purchaseAmount?: number;
  reference?: string;
};

@Injectable()
export class AccumulationService {
  constructor(
    private readonly ledger: LedgerRepository,
    private readonly support: LedgerSupportService,
    private readonly clock: Clock,
  ) {}

  async accumulate(user: AuthUser, input: AccumulationInput) {
    const branchId = await this.support.branchForOperation(
      user,
      input.branchId,
    );
    return this.ledger.idempotent(
      input.idempotencyKey,
      {
        type: "accumulate",
        cardCode: input.cardCode,
        amount: await this.amountFor(input.cardCode, input.purchaseAmount),
        purchaseAmount:
          input.purchaseAmount === undefined
            ? null
            : String(input.purchaseAmount),
        reference: input.reference ?? null,
      },
      async (manager) => {
        const account = await this.ledger.accountForUpdate(
          manager,
          input.cardCode,
        );
        if (!account || account.status !== "active")
          throw new NotFoundException("Tarjeta no encontrada.");
        const program = await this.ledger.program(account.programId);
        if (!program) throw new NotFoundException("Programa no encontrado.");
        const amount = ledgerStrategy(program).amount(
          program,
          input.purchaseAmount,
        );
        if (
          program.mode === "points" &&
          program.maxPointsPerOperation !== null &&
          amount > program.maxPointsPerOperation &&
          user.role === "cashier"
        ) {
          throw new ForbiddenException(
            "Esta operación requiere autorización de un gerente.",
          );
        }
        const timezone = process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City";
        const [start, end] = this.ledger.dayBounds(
          businessDate(this.clock.now(), timezone),
          timezone,
        );
        const counts = await this.ledger.fraudCounts(
          manager,
          account.id,
          user.id,
          start,
          end,
        );
        if (
          program.minIntervalMinutes !== null &&
          counts.lastAccumulation !== null
        ) {
          const remaining = Math.ceil(
            (program.minIntervalMinutes * 60_000 -
              (this.clock.now().getTime() - counts.lastAccumulation)) /
              60_000,
          );
          if (remaining > 0)
            throw new ConflictException(
              `Demasiado pronto: espera ${remaining} min para volver a acumular.`,
            );
        }
        if (
          program.maxAccumulationsPerCardPerDay !== null &&
          counts.cardCount >= program.maxAccumulationsPerCardPerDay
        ) {
          throw new ConflictException(
            "La tarjeta alcanzó el límite de acumulaciones del día.",
          );
        }
        if (
          program.maxAccumulationsPerStaffPerDay !== null &&
          counts.staffCount >= program.maxAccumulationsPerStaffPerDay
        ) {
          throw new ConflictException(
            "Alcanzaste el límite de acumulaciones del día.",
          );
        }
        const transaction = await this.ledger.insertTransaction(manager, {
          branchId,
          accountId: account.id,
          programId: program.id,
          type: "accumulate",
          amount,
          purchaseAmount:
            input.purchaseAmount === undefined
              ? null
              : String(input.purchaseAmount),
          actorId: user.id,
          reference: input.reference ?? null,
          idempotencyKey: input.idempotencyKey,
        });
        await this.ledger.saveAccount(
          manager,
          account,
          account.balance + amount,
        );
        return { transaction };
      },
    );
  }

  private async amountFor(cardCode: string, purchaseAmount?: number) {
    const account = await this.ledger.accountByCode(cardCode);
    if (!account) throw new NotFoundException("Tarjeta no encontrada.");
    const program = await this.ledger.program(account.programId);
    if (!program) throw new NotFoundException("Programa no encontrado.");
    return ledgerStrategy(program).amount(program, purchaseAmount);
  }
}
