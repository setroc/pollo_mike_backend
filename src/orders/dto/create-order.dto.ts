export class CreateOrderDto {
  products: OrderProductDto[];
  clientName: string;
  number: number;
}

class OrderProductDto {
  id: number;
  quantity: number;
}