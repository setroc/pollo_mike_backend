import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { OrderToProduct } from "./order-product.entity";

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('varchar', { length: 200 })
  clientName: string;
  @Column()
  number: number;
  @Column('decimal', { precision: 16, scale: 2})
  total: number;
  @Column('date')
  date: string;
  @Column('int')
  state: number;
  // relations
  @OneToMany(()=> OrderToProduct, orderToProduct => orderToProduct.order)
  orderToProduct: OrderToProduct[];
}

