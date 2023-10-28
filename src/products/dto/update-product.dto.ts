import { IsNotEmpty, Min, MinLength } from "class-validator";

export class UdpateProductDto {
  @IsNotEmpty({ message: 'El título no puede estar vacío.' })
  @MinLength(1, { message: 'El título debe contener al menos un caractér' })
  title: string;
  @IsNotEmpty({ message: 'El precio no puede estar vacío.' })
  @Min(0, { message: 'El precio mínimo es de 0' })
  price: number;
  @IsNotEmpty({ message: 'La descripción no puede estar vacío.' })
  description: string;
  @IsNotEmpty({ message: 'Debe ingresar la cantidad del producto' })
  stepQuantity: number;
}