import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@points-card/shared";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { Audit } from "../audit/audit.decorator";
import { RewardsService } from "./rewards.service";
import { CreateRewardDto } from "./dto/create-reward.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";
@Controller("programs")
@UseGuards(RolesGuard)
export class RewardsController {
  constructor(private readonly service: RewardsService) {}
  @Get(":id/rewards") @Roles(Role.Owner, Role.Manager, Role.Cashier) rewards(
    @Param("id") id: string,
    @Query("active") active?: string,
  ) {
    return this.service.list(id, active === "true");
  }
  @Get(":id/rewards/:rewardId")
  @Roles(Role.Owner, Role.Manager, Role.Cashier)
  reward(@Param("id") id: string, @Param("rewardId") rewardId: string) {
    return this.service.get(id, rewardId);
  }
  @Post(":id/rewards")
  @Roles(Role.Owner, Role.Manager)
  @Audit("reward.create")
  createReward(@Param("id") id: string, @Body() body: CreateRewardDto) {
    return this.service.create(id, body);
  }
  @Patch(":id/rewards/:rewardId")
  @Roles(Role.Owner, Role.Manager)
  @Audit("reward.update")
  updateReward(
    @Param("id") id: string,
    @Param("rewardId") rewardId: string,
    @Body() body: UpdateRewardDto,
  ) {
    return this.service.update(id, rewardId, body);
  }
  @Delete(":id/rewards/:rewardId")
  @Roles(Role.Owner, Role.Manager)
  @Audit("reward.delete")
  deleteReward(@Param("id") id: string, @Param("rewardId") rewardId: string) {
    return this.service.delete(id, rewardId);
  }
}
