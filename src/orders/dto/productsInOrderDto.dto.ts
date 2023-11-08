import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class ProductsInOrderDto {
  @IsNotEmpty({ message: 'El ID del producto no puede estar vacío.' })
  @IsNumber({ maxDecimalPlaces: 0 },{ message: 'El ID del producto debe ser un número.' })
  id: number;
  @IsNotEmpty({ message: 'La cantidad no puede esta vacío.' })
  @IsNumber({ maxDecimalPlaces: 1 },{ message: 'La cantidad debe ser un número.' })
  @Min(0.5, { message: 'La cantidad mínima es 0.5'})
  quantity: number;
}