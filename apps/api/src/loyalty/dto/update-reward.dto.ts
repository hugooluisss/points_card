import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class UpdateRewardDto {
  @IsOptional()
  @IsString({ message: "El nombre debe ser texto." })
  @MinLength(1, { message: "El nombre es obligatorio." })
  name?: string;
  @IsOptional()
  @IsInt({ message: "El costo debe ser un entero." })
  @Min(1, { message: "El costo debe ser mayor o igual a 1." })
  cost?: number;
  @IsOptional()
  @IsString({ message: "Las condiciones deben ser texto." })
  conditions?: string | null;
  @IsOptional()
  @IsBoolean({ message: "El estado debe ser verdadero o falso." })
  isActive?: boolean;
}
