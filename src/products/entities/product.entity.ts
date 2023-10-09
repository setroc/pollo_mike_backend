import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { OrderToProduct } from "src/orders/entities/order-product.entity";

@Entity({ name:'products' })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;
  @Column("varchar", { length: 200 })
  title: string;
  @Column()
  price: number;
  @Column("varchar", { length: 255 })
  description: string;
  // relations
  @OneToMany(()=> OrderToProduct, orderToProduct => orderToProduct.order)
  orderToProduct: OrderToProduct[];
}
