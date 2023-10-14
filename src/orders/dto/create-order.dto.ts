import { ArrayNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { OrderProductDto } from "./";

export class CreateOrderDto {
  @ArrayNotEmpty({ message: 'Debe ingresar productos.' })
  @ValidateNested({ each: true })
  @Type(()=> OrderProductDto)
  products: OrderProductDto[];
  @IsString({ message: 'El cliente debe ser una cadena.' })
  clientName: string;
  @IsNumber({maxDecimalPlaces:0}, { message: 'El número de la orden debe ser un número.'})
  number: number;
}