import { OrderProductDto } from "./create-order.dto";

export class UpdateOrderDto {
  id: number;
  products: OrderProductDto[];
  clientName: string;
  number: number;
}