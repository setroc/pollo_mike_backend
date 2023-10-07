import { OrderProduct } from "./order-product.entity";

export class Order {
  id: number;
  products: OrderProduct[];
  clientName: string;
  number: number;
  total: number;
}

