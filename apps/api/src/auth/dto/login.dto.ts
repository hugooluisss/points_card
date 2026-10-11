import { IsEmail, IsString, MinLength } from "class-validator";
import { LoginRequest } from "@points-card/shared";

export class LoginBody implements LoginRequest {
  @IsEmail({}, { message: "Ingresa un correo electrónico válido." })
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
