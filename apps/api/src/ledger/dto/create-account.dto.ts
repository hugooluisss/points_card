import { IsUUID } from "class-validator";
export class CreateAccountDto {
  @IsUUID() programId!: string;
}
