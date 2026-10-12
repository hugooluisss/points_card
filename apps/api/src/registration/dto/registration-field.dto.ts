import { IsBoolean, IsIn } from "class-validator";
import { RegistrationFieldKey } from "@points-card/shared";

export class RegistrationFieldDto {
  @IsIn(["name", "email", "phone", "birthday"], {
    message: "El campo no es válido.",
  })
  key!: RegistrationFieldKey;
  @IsBoolean({ message: "Indica si el campo es obligatorio." })
  required!: boolean;
}
