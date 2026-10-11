import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseTenantRepository } from "../tenancy/base-tenant.repository";
import { TenantContext } from "../tenancy/tenant-context.service";
import { LoyaltyReward } from "./entities/loyalty-reward.entity";

@Injectable()
export class RewardsRepository extends BaseTenantRepository<LoyaltyReward> {
  constructor(
    @InjectRepository(LoyaltyReward) rewards: Repository<LoyaltyReward>,
    tenant: TenantContext,
  ) {
    super(rewards, tenant);
  }

  listRewards(programId: string, activeOnly = false) {
    return this.find({
      where: { programId, ...(activeOnly ? { isActive: true } : {}) },
      order: { createdAt: "DESC" },
    });
  }
  reward(programId: string, id: string) {
    return this.findOne({ where: { programId, id } });
  }
  createReward(input: Partial<LoyaltyReward>) {
    return this.save(this.create(input));
  }
  updateReward(programId: string, id: string, values: Partial<LoyaltyReward>) {
    return this.update({ programId, id }, values);
  }
}
