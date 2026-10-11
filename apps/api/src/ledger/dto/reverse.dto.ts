import { IsString, MaxLength, MinLength } from "class-validator";
export class ReverseDto {
  @IsString() @MinLength(5) @MaxLength(255) reason!: string;
  @IsString() @MinLength(1) @MaxLength(100) idempotencyKey!: string;
}
