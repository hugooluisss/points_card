import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AuthUser, Role } from "@points-card/shared";
import { Audit } from "../audit/audit.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { BillingCheckoutDto } from "./dto/billing-checkout.dto";
import { BillingCheckoutService } from "./billing-checkout.service";
import { BillingOverviewService } from "./billing-overview.service";
import { BillingPortalService } from "./billing-portal.service";
import { BillingWebhookService } from "./billing-webhook.service";

@Controller("billing")
@UseGuards(RolesGuard)
export class BillingController {
  constructor(
    private readonly overview: BillingOverviewService,
    private readonly checkoutService: BillingCheckoutService,
    private readonly portalService: BillingPortalService,
    private readonly webhookService: BillingWebhookService,
  ) {}
  @Get() @Roles(Role.Owner) get(@CurrentUser() _user: AuthUser) {
    return this.overview.get();
  }
  @Post("checkout") @Roles(Role.Owner) @Audit("billing.checkout") checkout(
    @Body() body: BillingCheckoutDto,
  ) {
    return this.checkoutService.checkout(body.planId);
  }
  @Post("portal") @Roles(Role.Owner) @Audit("billing.portal") portal() {
    return this.portalService.portal();
  }
  @Public() @Post("webhook") webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature?: string,
  ) {
    return this.webhookService.handle(
      req.rawBody ?? Buffer.alloc(0),
      signature,
    );
  }
}
