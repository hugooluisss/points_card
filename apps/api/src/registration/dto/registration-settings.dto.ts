import { RegistrationSettingsDto } from "@points-card/shared";
export class RegistrationSettingsResponseDto implements RegistrationSettingsDto {
  fields!: RegistrationSettingsDto["fields"];
  brandColor!: string | null;
  logoUrl!: string | null;
  publicCode!: string;
  publicUrl!: string;
}
