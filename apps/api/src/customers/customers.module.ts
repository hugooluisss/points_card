import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsentsModule } from "../consents/consents.module";
import { RolesGuard } from "../auth/roles.guard";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyTransaction } from "../ledger/entities/loyalty-transaction.entity";
import { Customer } from "./entities/customer.entity";
import { CustomersController } from "./customers.controller";
import { CustomersRepository } from "./customers.repository";
import { CustomersService } from "./customers.service";
import { DashboardModule } from "../dashboard/dashboard.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, LoyaltyAccount, LoyaltyTransaction]),
    ConsentsModule,
    DashboardModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersRepository, CustomersService, RolesGuard],
})
export class CustomersModule {}
