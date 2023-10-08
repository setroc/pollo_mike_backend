import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
