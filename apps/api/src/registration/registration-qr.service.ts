import { Injectable } from "@nestjs/common";
import { toString } from "qrcode";
import { RegistrationSettingsService } from "./registration-settings.service";

@Injectable()
export class RegistrationQrService {
  constructor(private readonly settings: RegistrationSettingsService) {}
  async svg() {
    return toString((await this.settings.get()).publicUrl, { type: "svg" });
  }
}
