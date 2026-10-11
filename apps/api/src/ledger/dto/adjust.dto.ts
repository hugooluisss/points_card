import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
export class AdjustDto {
  @IsString() @MinLength(1) @MaxLength(64) cardCode!: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsInt() amount!: number;
  @IsString() @MinLength(5) @MaxLength(255) reason!: string;
  @IsString() @MinLength(1) @MaxLength(100) idempotencyKey!: string;
}
