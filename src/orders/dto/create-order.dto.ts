import { ArrayNotEmpty, IsDateString, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { ProductsInOrderDto } from "./";

export class CreateOrderDto {
  @ArrayNotEmpty({ message: 'Debe ingresar productos.' })
  @ValidateNested({ each: true })
  @Type(()=> ProductsInOrderDto)
  products: ProductsInOrderDto[];
  @IsString({ message: 'El cliente debe ser una cadena.' })
  clientName: string;
  @IsNumber({}, { message: 'El número de la orden debe ser un número.'})
  number: number;
  @IsNotEmpty({ message: 'Debe ingresar una fecha.' })
  @IsDateString({ strict: false }, { message: 'No es una fecha válida.' })
  date: string;
  @IsNumber({}, { message: 'Debe ingresar un estado'})
  state: number;
}