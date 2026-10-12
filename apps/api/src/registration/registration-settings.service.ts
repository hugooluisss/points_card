import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UpdateRegistrationSettingsDto } from "./dto/update-registration-settings.dto";
import { RegistrationRepository } from "./registration.repository";

@Injectable()
export class RegistrationSettingsService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly config: ConfigService,
  ) {}
  private url(publicCode: string) {
    return `${(this.config.get("PUBLIC_WEB_URL") || "https://agents-dev.hugosantiago.dev/points-card-app").replace(/\/$/, "")}/r/${publicCode}`;
  }
  async get() {
    const business = await this.registrations.settings();
    if (!business) throw new NotFoundException("Comercio no encontrado.");
    return {
      fields: business.registrationFields,
      brandColor: business.brandColor,
      logoUrl: business.logoUrl,
      publicCode: business.publicCode,
      publicUrl: this.url(business.publicCode),
    };
  }
  async update(input: UpdateRegistrationSettingsDto) {
    const keys = new Set(input.fields.map(({ key }) => key));
    if (!keys.has("name") || (!keys.has("email") && !keys.has("phone")))
      throw new BadRequestException(
        "Configura nombre y al menos un medio de contacto.",
      );
    const business = await this.registrations.updateSettings(input);
    if (!business) throw new NotFoundException("Comercio no encontrado.");
    return this.get();
  }
}
