import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateProgramDto {
  @IsString({ message: "El nombre es obligatorio." })
  @MinLength(1, { message: "El nombre es obligatorio." })
  name!: string;
  @IsEnum(["stamps", "points"], {
    message: "La modalidad debe ser sellos o puntos.",
  })
  mode!: "stamps" | "points";
  @IsDateString({}, { message: "La fecha de inicio no es válida." })
  validFrom!: string;
  @IsOptional()
  @IsDateString({}, { message: "La fecha de término no es válida." })
  validUntil?: string | null;
  @IsOptional()
  @IsInt({ message: "La meta de sellos debe ser un entero." })
  @Min(1, { message: "La meta de sellos debe ser mayor o igual a 1." })
  stampsGoal?: number | null;
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: "La tasa de puntos debe ser un número con hasta 4 decimales." },
  )
  @Min(0.0001, { message: "La tasa de puntos debe ser mayor a 0." })
  pointsPerCurrencyUnit?: number | null;
  @IsOptional()
  @IsInt({ message: "El límite debe ser un entero positivo." })
  @Min(1, { message: "El límite debe ser un entero positivo." })
  minIntervalMinutes?: number | null;
  @IsOptional()
  @IsInt({ message: "El límite debe ser un entero positivo." })
  @Min(1, { message: "El límite debe ser un entero positivo." })
  maxAccumulationsPerCardPerDay?: number | null;
  @IsOptional()
  @IsInt({ message: "El límite debe ser un entero positivo." })
  @Min(1, { message: "El límite debe ser un entero positivo." })
  maxAccumulationsPerStaffPerDay?: number | null;
  @IsOptional()
  @IsInt({ message: "El límite debe ser un entero positivo." })
  @Min(1, { message: "El límite debe ser un entero positivo." })
  maxPointsPerOperation?: number | null;
  @IsOptional()
  @IsInt({ message: "El umbral debe ser un entero positivo." })
  @Min(1, { message: "El umbral debe ser un entero positivo." })
  staffDailyAlertThreshold?: number | null;
}
