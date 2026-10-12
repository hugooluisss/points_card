import { IsString, MinLength } from "class-validator";

export class CreatePrivacyNoticeDto {
  @IsString({ message: "El aviso debe ser texto." })
  @MinLength(50, { message: "El aviso debe tener al menos 50 caracteres." })
  text!: string;
}
