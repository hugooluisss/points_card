import { DashboardPeriod } from "@points-card/shared";
import { IsIn, IsOptional, IsUUID } from "class-validator";

export class DashboardSummaryQueryDto {
  @IsOptional()
  @IsIn(["7d", "30d", "90d"], { message: "El periodo debe ser 7d, 30d o 90d." })
  period: DashboardPeriod = "7d";

  @IsOptional()
  @IsUUID("4", { message: "La sucursal no es válida." })
  branchId?: string;
}
