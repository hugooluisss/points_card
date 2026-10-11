import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
import { BaseTenantRepository } from "../tenancy/base-tenant.repository";
import { TenantContext } from "../tenancy/tenant-context.service";
import { LoyaltyProgram } from "./entities/loyalty-program.entity";
import { LoyaltyReward } from "./entities/loyalty-reward.entity";

@Injectable()
export class ProgramsRepository extends BaseTenantRepository<LoyaltyProgram> {
  constructor(
    @InjectRepository(LoyaltyProgram) programs: Repository<LoyaltyProgram>,
    @InjectRepository(LoyaltyReward)
    private readonly rewards: Repository<LoyaltyReward>,
    tenant: TenantContext,
  ) {
    super(programs, tenant);
  }

  listPrograms() {
    return this.find({ order: { createdAt: "DESC" } });
  }
  program(id: string) {
    return this.findOne({ where: { id } });
  }
  createProgram(input: Partial<LoyaltyProgram>) {
    return this.save(this.create(input));
  }
  updateProgram(id: string, values: Partial<LoyaltyProgram>) {
    return this.update({ id }, values);
  }
  hasRewardCostAbove(programId: string, cost: number) {
    return this.rewards.exists({
      where: {
        businessId: this.tenantContext.getBusinessId(),
        programId,
        cost: MoreThan(cost),
      },
    });
  }
}
