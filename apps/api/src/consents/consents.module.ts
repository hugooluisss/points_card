import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Consent } from "./entities/consent.entity";
import { ConsentsRepository } from "./consents.repository";
import { ConsentsService } from "./consents.service";

@Module({
  imports: [TypeOrmModule.forFeature([Consent])],
  providers: [ConsentsRepository, ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
