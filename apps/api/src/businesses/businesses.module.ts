import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from './entities/business.entity';
import { StaffUser } from '../staff/entities/staff-user.entity';
import { BusinessRepository } from './business.repository';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Branch, StaffUser])],
  controllers: [BusinessesController],
  providers: [BusinessRepository, BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
