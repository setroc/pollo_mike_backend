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
  @Column("decimal", { precision: 16, scale: 2})
  stepQuantity: number;
  @Column("varchar", { length: 200 })
  type: string;
  @Column("varchar", { length: 200 })
  imgName: string;
  // relations
  @OneToMany(()=> OrderToProduct, orderToProduct => orderToProduct.order)
  orderToProduct: OrderToProduct[];
  @OneToMany(()=> StockToProduct, stockToProduct => stockToProduct.stock)
  stock: StockToProduct[];
}
