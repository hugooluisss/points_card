import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class RegisterCustomerDto {
  @IsOptional()
  @IsString({ message: "El nombre no es válido." })
  @MaxLength(255)
  name?: string;
  @IsOptional()
  @IsString({ message: "El correo no es válido." })
  email?: string;
  @IsOptional()
  @IsString({ message: "El teléfono no es válido." })
  phone?: string;
  @IsOptional()
  @IsString({ message: "La fecha de nacimiento no es válida." })
  birthday?: string;
  @IsBoolean({ message: "Debes aceptar el aviso de privacidad." })
  acceptPrivacy!: true;
  @IsBoolean({ message: "La preferencia de promociones no es válida." })
  acceptMarketing!: boolean;
  @IsString() website!: string;
  @IsNumber() startedAt!: number;
}
