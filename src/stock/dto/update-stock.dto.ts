import { ArrayNotEmpty, IsDateString, IsEmpty, IsNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { ProductStockDto } from "./product-stock.dto";

export class UpdateStockDto {
  @IsNotEmpty({ message: 'Debe ingresar una fecha.' })
  @IsDateString({ strict: false }, { message: 'No es una fecha válida.' })
  date: string;
  @ArrayNotEmpty({ message: 'Debe ingresar productos.' })
  @ValidateNested({ each: true })
  @Type(()=> ProductStockDto)
  products: ProductStockDto[];
}