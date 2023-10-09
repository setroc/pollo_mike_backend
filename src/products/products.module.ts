import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

import { Product } from './entities/product.entity';
import { OrderToProduct } from 'src/orders/entities/order-product.entity';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    TypeOrmModule.forFeature([Product, OrderToProduct]),
  ]
})
export class ProductsModule {}
