import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard";
import { LoyaltyProgram } from "./entities/loyalty-program.entity";
import { LoyaltyReward } from "./entities/loyalty-reward.entity";
import { ProgramsController } from "./programs.controller";
import { RewardsController } from "./rewards.controller";
import { ProgramsRepository } from "./programs.repository";
import { RewardsRepository } from "./rewards.repository";
import { ProgramsService } from "./programs.service";
import { RewardsService } from "./rewards.service";

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyProgram, LoyaltyReward])],
  controllers: [ProgramsController, RewardsController],
  providers: [
    ProgramsRepository,
    RewardsRepository,
    ProgramsService,
    RewardsService,
    RolesGuard,
  ],
})
export class LoyaltyModule {}
