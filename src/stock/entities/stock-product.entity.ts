import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "src/products/entities/product.entity";
import { Stock } from "./stock.entity";

@Entity({ name: 'stock_products' })
export class StockToProduct {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  stockId: number;
  @Column()
  productId: number;
  @Column('decimal', { precision: 16, scale: 1})
  quantity: number;

  // relations
  @ManyToOne(
    ()=> Stock, 
    stock => stock.stockToProduct,
  )
  stock: Stock;
  @ManyToOne(
    ()=> Product, 
    product => product.orderToProduct,
  )
  product: Product;
}