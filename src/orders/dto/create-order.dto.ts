export class CreateOrderDto {
  products: OrderProductDto[];
  clientName: string;
  number: number;
}

export class OrderProductDto {
  productId: number;
  quantity: number;
}