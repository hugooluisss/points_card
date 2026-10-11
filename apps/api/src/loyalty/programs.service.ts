import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  LoyaltyMode,
  LoyaltyProgramDto,
  LoyaltyRewardDto,
} from "@points-card/shared";
import { LoyaltyProgram } from "./entities/loyalty-program.entity";
import { ProgramsRepository } from "./programs.repository";
interface CreateProgramInput
  extends
    Pick<LoyaltyProgramDto, "name" | "mode" | "validFrom">,
    Partial<
      Pick<
        LoyaltyProgramDto,
        | "validUntil"
        | "stampsGoal"
        | "minIntervalMinutes"
        | "maxAccumulationsPerCardPerDay"
        | "maxAccumulationsPerStaffPerDay"
        | "maxPointsPerOperation"
        | "staffDailyAlertThreshold"
      >
    > {
  pointsPerCurrencyUnit?: number | null;
}
interface UpdateProgramInput extends Partial<CreateProgramInput> {}
@Injectable()
export class ProgramsService {
  constructor(private readonly programs: ProgramsRepository) {}
  list() {
    return this.programs.listPrograms();
  }
  async get(id: string) {
    const row = await this.programs.program(id);
    if (!row) throw new NotFoundException("Programa no encontrado.");
    return row;
  }
  async create(input: CreateProgramInput) {
    this.validateRule(input);
    if (input.validUntil && input.validUntil < input.validFrom)
      throw new BadRequestException(
        "La fecha de término debe ser igual o posterior a la fecha de inicio.",
      );
    try {
      return await this.programs.createProgram({
        name: input.name,
        mode: input.mode,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        stampsGoal: input.stampsGoal,
        pointsPerCurrencyUnit:
          typeof input.pointsPerCurrencyUnit === "number"
            ? String(input.pointsPerCurrencyUnit)
            : input.pointsPerCurrencyUnit,
        minIntervalMinutes: input.minIntervalMinutes ?? null,
        maxAccumulationsPerCardPerDay:
          input.maxAccumulationsPerCardPerDay ?? null,
        maxAccumulationsPerStaffPerDay:
          input.maxAccumulationsPerStaffPerDay ?? null,
        maxPointsPerOperation: input.maxPointsPerOperation ?? null,
        staffDailyAlertThreshold: input.staffDailyAlertThreshold ?? null,
        status: "inactive",
      });
    } catch (error) {
      this.throwDuplicate(error);
    }
  }
  async update(id: string, input: UpdateProgramInput) {
    const program = await this.get(id);
    if (input.mode !== undefined && input.mode !== program.mode)
      throw new BadRequestException(
        "La modalidad no se puede cambiar después de crear el programa.",
      );
    const values = {
      ...input,
      mode: program.mode,
      ...(typeof input.pointsPerCurrencyUnit === "number"
        ? { pointsPerCurrencyUnit: String(input.pointsPerCurrencyUnit) }
        : {}),
    } as Partial<LoyaltyProgram>;
    this.validateRule({
      mode: program.mode,
      stampsGoal: values.stampsGoal ?? program.stampsGoal,
      pointsPerCurrencyUnit:
        values.pointsPerCurrencyUnit ?? program.pointsPerCurrencyUnit,
    });
    const validFrom = values.validFrom ?? program.validFrom;
    const validUntil =
      values.validUntil === undefined ? program.validUntil : values.validUntil;
    if (validUntil && validUntil < validFrom)
      throw new BadRequestException(
        "La fecha de término debe ser igual o posterior a la fecha de inicio.",
      );
    if (
      program.mode === "stamps" &&
      values.stampsGoal !== undefined &&
      values.stampsGoal !== null &&
      (await this.programs.hasRewardCostAbove(id, values.stampsGoal))
    )
      throw new BadRequestException(
        "La meta de sellos no puede ser menor al costo de una recompensa existente.",
      );
    await this.programs.updateProgram(id, values);
    return this.get(id);
  }
  async setStatus(id: string, status: "active" | "inactive") {
    await this.get(id);
    try {
      await this.programs.updateProgram(id, { status });
    } catch (error) {
      this.throwDuplicate(error);
    }
    return this.get(id);
  }
  private validateRule(input: {
    mode: LoyaltyMode;
    stampsGoal?: number | null;
    pointsPerCurrencyUnit?: number | string | null;
  }) {
    if (
      input.mode === "stamps" &&
      (!Number.isInteger(input.stampsGoal) || (input.stampsGoal ?? 0) < 1)
    )
      throw new BadRequestException(
        "La meta de sellos debe ser un entero mayor o igual a 1.",
      );
    if (input.mode === "points" && !(Number(input.pointsPerCurrencyUnit) > 0))
      throw new BadRequestException(
        "Los puntos por unidad monetaria deben ser mayores a 0.",
      );
  }
  private throwDuplicate(error: unknown): never {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      throw new ConflictException(
        "Ya existe un programa activo de esta modalidad para este comercio.",
      );
    throw error;
  }
}
