import { IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

export class CustomerQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: "La búsqueda debe ser texto." })
  @MaxLength(100, { message: "La búsqueda no puede superar 100 caracteres." })
  search?: string;
}
