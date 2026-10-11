import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
export class RedeemDto {
  @IsString() @MinLength(1) @MaxLength(64) cardCode!: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsUUID() rewardId!: string;
  @IsString() @MinLength(1) @MaxLength(100) idempotencyKey!: string;
}
