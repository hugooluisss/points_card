import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { RegistrationFieldDto } from "./registration-field.dto";

export class UpdateRegistrationSettingsDto {
  @IsArray({ message: "Los campos deben ser una lista." })
  @ArrayMinSize(1, { message: "Incluye al menos un campo." })
  @ValidateNested({ each: true })
  @Type(() => RegistrationFieldDto)
  fields!: RegistrationFieldDto[];

  @ValidateIf((_object, value) => value !== null)
  @IsString({ message: "El color no es válido." })
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: "El color debe tener formato #RRGGBB.",
  })
  brandColor!: string | null;

  @ValidateIf((_object, value) => value !== null)
  @IsString({ message: "La URL del logotipo no es válida." })
  @MaxLength(500, {
    message: "La URL del logotipo no puede superar 500 caracteres.",
  })
  @Matches(/^https?:\/\/.+/i, {
    message: "La URL del logotipo debe usar http o https.",
  })
  logoUrl!: string | null;
}
