import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order } from './entities/order.entity';
import { OrderToProduct } from './entities/order-product.entity';
import { Product } from 'src/products/entities/product.entity';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    TypeOrmModule.forFeature([Order, Product, OrderToProduct])
  ]
})
export class OrdersModule {}
