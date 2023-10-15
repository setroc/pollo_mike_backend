import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { OrderToProduct } from "src/orders/entities/order-product.entity";
import { StockToProduct } from "src/stock/entities/stock-product.entity";

@Entity({ name:'products' })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;
  @Column("varchar", { length: 200 })
  title: string;
  @Column()
  price: number;
  @Column("varchar", { length: 200 })
  description: string;
  // relations
  @OneToMany(()=> OrderToProduct, orderToProduct => orderToProduct.order)
  orderToProduct: OrderToProduct[];
  @OneToMany(()=> StockToProduct, stockToProduct => stockToProduct.stock)
  stock: StockToProduct[];
}
