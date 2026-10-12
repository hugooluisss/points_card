import {
  Body,
  Controller,
  Get,
  Header,
  Ip,
  Param,
  Post,
  Put,
  UseGuards,
  Res,
  HttpCode,
} from "@nestjs/common";
import { Response } from "express";
import { Role } from "@points-card/shared";
import { Audit } from "../audit/audit.decorator";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UpdateRegistrationSettingsDto } from "./dto/update-registration-settings.dto";
import { RegisterCustomerDto } from "./dto/register-customer.dto";
import { RegistrationSettingsService } from "./registration-settings.service";
import { RegistrationQrService } from "./registration-qr.service";
import { PublicRegistrationService } from "./public-registration.service";
import { CardRecoveryService } from "./card-recovery.service";
import { CardLifecycleService } from "./card-lifecycle.service";

@Controller()
@UseGuards(RolesGuard)
export class RegistrationController {
  constructor(
    private readonly settings: RegistrationSettingsService,
    private readonly qr: RegistrationQrService,
    private readonly publicRegistration: PublicRegistrationService,
    private readonly recovery: CardRecoveryService,
    private readonly cards: CardLifecycleService,
  ) {}
  @Get("registration-settings") @Roles(Role.Owner, Role.Manager) settingsGet() {
    return this.settings.get();
  }
  @Put("registration-settings")
  @Roles(Role.Owner, Role.Manager)
  @Audit("registration.settings.update")
  settingsPut(@Body() body: UpdateRegistrationSettingsDto) {
    return this.settings.update(body);
  }
  @Get("registration-qr")
  @Roles(Role.Owner, Role.Manager)
  @Header("Content-Type", "image/svg+xml")
  async qrGet(@Res() response: Response) {
    response.type("image/svg+xml").send(await this.qr.svg());
  }
  @Public() @Get("public/registration/:publicCode") page(
    @Param("publicCode") code: string,
  ) {
    return this.publicRegistration.page(code);
  }
  @Public() @Post("public/registration/:publicCode") register(
    @Param("publicCode") code: string,
    @Body() body: RegisterCustomerDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.publicRegistration
      .register(code, body as RegisterCustomerDto & { acceptPrivacy: true }, ip)
      .then((result) => {
        if (result.existing) response.status(200);
        return result;
      });
  }
  @Public() @Get("public/card/:token") recover(@Param("token") token: string) {
    return this.recovery.recover(token);
  }
  @Public() @Post("public/consent/revoke") revokeConsent(
    @Body() body: { token: string },
  ) {
    return this.publicRegistration.revokeMarketing(body.token);
  }
  @Post("cards/:accountId/disable")
  @Roles(Role.Owner, Role.Manager)
  @Audit("card.disable")
  disable(@Param("accountId") id: string) {
    return this.cards.disable(id);
  }
  @Post("cards/:accountId/reissue")
  @Roles(Role.Owner, Role.Manager)
  @Audit("card.reissue")
  reissue(@Param("accountId") id: string) {
    return this.cards.reissue(id);
  }
}
