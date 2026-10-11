import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { RegisterBusinessDto as RegisterBusinessContract } from '@points-card/shared';

export class RegisterBusinessRequest implements RegisterBusinessContract {
  @IsString({ message: 'El nombre del comercio es obligatorio.' })
  @MinLength(1, { message: 'El nombre del comercio es obligatorio.' })
  businessName!: string;

  @IsOptional()
  @IsString({ message: 'El nombre de la sucursal debe ser texto.' })
  branchName?: string;

  @IsString({ message: 'El nombre del propietario es obligatorio.' })
  @MinLength(1, { message: 'El nombre del propietario es obligatorio.' })
  ownerName!: string;

  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  email!: string;

  @IsString({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password!: string;
}
