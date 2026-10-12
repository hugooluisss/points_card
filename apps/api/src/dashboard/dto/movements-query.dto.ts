import { IsIn, IsISO8601, IsOptional, IsUUID } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

export class MovementsQueryDto extends PaginationQueryDto {
  @IsISO8601(
    { strict: true },
    { message: "La fecha inicial debe tener formato YYYY-MM-DD." },
  )
  from!: string;
  @IsISO8601(
    { strict: true },
    { message: "La fecha final debe tener formato YYYY-MM-DD." },
  )
  to!: string;
  @IsOptional()
  @IsUUID("4", { message: "La sucursal no es válida." })
  branchId?: string;
  @IsOptional()
  @IsUUID("4", { message: "El empleado no es válido." })
  staffId?: string;
  @IsOptional()
  @IsIn(["accumulate", "redeem", "adjust", "reverse"], {
    message: "El tipo de movimiento no es válido.",
  })
  type?: string;
}
