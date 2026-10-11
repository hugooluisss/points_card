import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
export class AccumulateDto {
  @IsString() @MinLength(1) @MaxLength(64) cardCode!: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsString() @MinLength(1) @MaxLength(100) idempotencyKey!: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  purchaseAmount?: number;
  @IsOptional() @IsString() @MaxLength(100) reference?: string;
}
