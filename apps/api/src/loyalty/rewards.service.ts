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
import { RewardsRepository } from "./rewards.repository";
interface CreateRewardInput
  extends
    Pick<LoyaltyRewardDto, "name" | "cost">,
    Partial<Pick<LoyaltyRewardDto, "conditions" | "isActive">> {}
interface UpdateRewardInput extends Partial<CreateRewardInput> {}
@Injectable()
export class RewardsService {
  constructor(
    private readonly programs: ProgramsRepository,
    private readonly rewards: RewardsRepository,
  ) {}
  private async program(id: string) {
    const row = await this.programs.program(id);
    if (!row) throw new NotFoundException("Programa no encontrado.");
    return row;
  }
  async list(id: string, activeOnly = false) {
    await this.program(id);
    return this.rewards.listRewards(id, activeOnly);
  }
  async get(id: string, rewardId: string) {
    await this.program(id);
    const row = await this.rewards.reward(id, rewardId);
    if (!row) throw new NotFoundException("Recompensa no encontrada.");
    return row;
  }
  async create(programId: string, input: CreateRewardInput) {
    const program = await this.program(programId);
    if (program.mode === "stamps" && input.cost > (program.stampsGoal ?? 0))
      throw new BadRequestException(
        "El costo no puede superar la meta de sellos del programa.",
      );
    return this.rewards.createReward({ ...input, programId });
  }
  async update(programId: string, id: string, input: UpdateRewardInput) {
    const program = await this.program(programId);
    await this.get(programId, id);
    if (
      program.mode === "stamps" &&
      input.cost !== undefined &&
      input.cost > (program.stampsGoal ?? 0)
    )
      throw new BadRequestException(
        "El costo no puede superar la meta de sellos del programa.",
      );
    await this.rewards.updateReward(programId, id, input);
    return this.get(programId, id);
  }
  async delete(programId: string, id: string) {
    await this.get(programId, id);
    await this.rewards.updateReward(programId, id, { isActive: false });
    return this.get(programId, id);
  }
}
