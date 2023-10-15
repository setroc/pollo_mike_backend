import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { Product } from "src/products/entities/product.entity";
import { StockToProduct } from "./stock-product.entity";

@Entity({ name:'stock' })
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('datetime')
  date: string;
  // relations
  @OneToMany(
    () => StockToProduct, 
    stockToProduct => stockToProduct.stock,
    { eager : true }
  )
  stockToProduct: StockToProduct[];
}
