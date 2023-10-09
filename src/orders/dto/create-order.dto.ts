export class CreateOrderDto {
  products: OrderProductDto[];
  clientName: string;
  number: number;
}

export class OrderProductDto {
  id: number;
  quantity: number;
}