import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { StockModule } from './stock/stock.module';

import { Product } from './products/entities/product.entity';
import { OrderToProduct } from './orders/entities/order-product.entity';
import { Order } from './orders/entities/order.entity';
import { Stock } from './stock/entities/stock.entity';
import { StockToProduct } from './stock/entities/stock-product.entity';

@Module({
  imports: [
    ProductsModule, 
    OrdersModule,
    StockModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Tmc1480',
      database: 'PolloMike',
      entities: [Product, OrderToProduct, Order, Stock, StockToProduct],
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
