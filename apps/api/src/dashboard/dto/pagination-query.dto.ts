import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "La página debe ser un número entero." })
  @Min(1, { message: "La página debe ser al menos 1." })
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El tamaño debe ser un número entero." })
  @Min(1, { message: "El tamaño debe ser al menos 1." })
  @Max(100, { message: "El tamaño máximo es 100." })
  pageSize = 20;
}
