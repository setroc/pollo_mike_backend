import { ArrayNotEmpty, IsDateString, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { OrderProductDto } from "./";

export class UpdateOrderDto {
  @ArrayNotEmpty({ message: 'Debe ingresar productos.' })
  @ValidateNested({ each: true })
  @Type(()=> OrderProductDto)
  products: OrderProductDto[];
  @IsString({ message: 'El cliente debe ser una cadena.' })
  clientName: string;
  @IsNumber({maxDecimalPlaces:0}, { message: 'El número de la orden debe ser un número.'})
  number: number;
  @IsNotEmpty({ message: 'Debe ingresar una fecha.' })
  @IsDateString({ strict: false }, { message: 'No es una fecha válida.' })
  date: string;
}