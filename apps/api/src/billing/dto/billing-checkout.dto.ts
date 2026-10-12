import { IsUUID } from "class-validator";

export class BillingCheckoutDto {
  @IsUUID() planId!: string;
}
