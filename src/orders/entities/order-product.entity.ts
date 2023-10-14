import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { Product } from "src/products/entities/product.entity";

@Entity({ name: 'orders_products' })
export class OrderToProduct {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  orderId: number;
  @Column()
  productId: number;
  @Column('decimal', { precision: 16, scale: 1})
  quantity: number;

  // relations
  @ManyToOne(()=> Order, order => order.orderToProduct)
  order: Order;
  @ManyToOne(()=> Product, product => product.orderToProduct)
  product: Product;
}