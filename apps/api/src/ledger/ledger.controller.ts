import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthUser, Role } from "@points-card/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { Audit } from "../audit/audit.decorator";
import { AccountsService } from "./accounts.service";
import { AccumulationService } from "./accumulation.service";
import { AdjustmentService } from "./adjustment.service";
import { CardsService } from "./cards.service";
import { LedgerReportsService } from "./ledger-reports.service";
import { RedemptionService } from "./redemption.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { AccumulateDto } from "./dto/accumulate.dto";
import { RedeemDto } from "./dto/redeem.dto";
import { AdjustDto } from "./dto/adjust.dto";
import { ReverseDto } from "./dto/reverse.dto";

@Controller()
@UseGuards(RolesGuard)
export class LedgerController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly cards: CardsService,
    private readonly reports: LedgerReportsService,
    private readonly accumulation: AccumulationService,
    private readonly redemption: RedemptionService,
    private readonly adjustment: AdjustmentService,
  ) {}

  @Post("ledger/accounts")
  @Roles(Role.Owner, Role.Manager)
  @Audit("ledger.account.create")
  createAccount(
    @CurrentUser() _user: AuthUser,
    @Body() body: CreateAccountDto,
  ) {
    return this.accounts.createAccount(body.programId);
  }
  @Get("cards/:cardCode")
  @Roles(Role.Owner, Role.Manager, Role.Cashier)
  card(@Param("cardCode") cardCode: string) {
    return this.cards.card(cardCode);
  }
  @Get("ledger/anomalies")
  @Roles(Role.Owner, Role.Manager)
  anomalies(@Query("date") date: string) {
    return this.reports.anomalies(date);
  }
  @Post("ledger/accumulate")
  @Roles(Role.Owner, Role.Manager, Role.Cashier)
  @Audit("ledger.accumulate")
  accumulate(@CurrentUser() user: AuthUser, @Body() body: AccumulateDto) {
    return this.accumulation.accumulate(user, body);
  }
  @Post("ledger/redeem")
  @Roles(Role.Owner, Role.Manager, Role.Cashier)
  @Audit("ledger.redeem")
  redeem(@CurrentUser() user: AuthUser, @Body() body: RedeemDto) {
    return this.redemption.redeem(user, body);
  }
  @Post("ledger/adjust")
  @Roles(Role.Owner, Role.Manager)
  @Audit("ledger.adjust")
  adjust(@CurrentUser() user: AuthUser, @Body() body: AdjustDto) {
    return this.adjustment.adjust(user, body);
  }
  @Post("ledger/:transactionId/reverse")
  @Roles(Role.Owner, Role.Manager)
  @Audit("ledger.reverse")
  reverse(
    @CurrentUser() user: AuthUser,
    @Param("transactionId") transactionId: string,
    @Body() body: ReverseDto,
  ) {
    return this.adjustment.reverse(user, transactionId, body);
  }
}
