export class UpdateOrderDto {
  id: number;
  products: OrderProductDto[];
  clientName: string;
  number: number;
}

class OrderProductDto {
  id: number;
  quantity: number;
}