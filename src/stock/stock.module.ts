import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StockController } from './stock.controller';
import { StockService } from './stock.service';

import { Stock } from './entities/stock.entity';
import { Product } from 'src/products/entities/product.entity';
import { StockToProduct } from './entities/stock-product.entity';

@Module({
  controllers: [StockController],
  providers: [StockService],
  imports: [
    TypeOrmModule.forFeature([Stock, Product, StockToProduct])
  ]
})
export class StockModule {}
