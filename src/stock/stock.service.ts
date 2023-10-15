import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CreateStockDto, UpdateStockDto } from './dto';

import { Stock } from './entities/stock.entity';
import { Product } from 'src/products/entities/product.entity';
import { StockToProduct } from './entities/stock-product.entity';

@Injectable()
export class StockService {

  constructor(
    @InjectRepository(Stock) private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockToProduct) private readonly stockToProductRepository: Repository<StockToProduct>,
    @InjectRepository(Product) private readonly productRepository: Repository<Stock>,
  ){}

  async findAll() : Promise<Stock[]> {
    return await this.stockRepository.find({ relations: ['stockToProduct', 'stockToProduct.product'] });
  }

  async findById( id: number ) : Promise<Stock> {
    const stock = await this.stockRepository.findOne({ where: { id }, relations: ['stockToProduct', 'stockToProduct.product'] });
    if (!stock) throw new NotFoundException(`Stock with ID ${ id } not found`);
    return stock;
  }

  async create( createStock : CreateStockDto) : Promise<Stock> {
    try {
      // validate all products exist
      for( const p of createStock.products)  {
        const product = await this.productRepository.findOne({ where: {id: p.productId}});
        if (!product) throw new NotFoundException(`Product with ID ${ p.productId } not found`);
      };
      // create new stock
      const stock = this.stockRepository.create({ date: createStock.date });
      const stockCreated = await this.stockRepository.save(stock);
      // create and associate the products in the stock
      const stockToProductPromises = createStock.products.map(  (p) => {
        const stp = this.stockToProductRepository.create({ 
          stockId: stockCreated.id, 
          productId: p.productId,
          quantity: p.quantity
        });
        return this.stockToProductRepository.save(stp);
      });
      await Promise.all(stockToProductPromises);
      return await this.stockRepository.findOne({ where: { id: stock.id }, relations: ['stockToProduct', 'stockToProduct.product'] })
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error creating stock.');
    }
  }

  async update(id: number, updateStock: UpdateStockDto) : Promise<Stock> {
    try {
      // verify if stock exists
      let stock = await this.findById(id);
      // validate all products exist
      for( const p of updateStock.products)  {
        const product = await this.productRepository.findOne({ where: {id: p.productId}});
        if (!product) throw new NotFoundException(`Product with ID ${ p.productId } not found`);
      };
      // update stockToProducts
      const idStockToProducToDelete = [];
      const productsIdToUpdate = updateStock.products.reduce((a,b) => [...a, b.productId], []);
      stock.stockToProduct.forEach( stp => {
        if (!productsIdToUpdate.includes(stp.productId)) idStockToProducToDelete.push(stp.id);
      })
      await this.stockToProductRepository.delete({ id: In(idStockToProducToDelete) });
      for(const product of updateStock.products) {
        const stp = await this.stockToProductRepository.findOne({ where: { stockId: id, productId: product.productId } });
        if (stp) {
          stp.quantity = product.quantity;
          await this.stockToProductRepository.save(stp);
        } else {
          const newStp = this.stockToProductRepository.create({
            stockId: id,
            productId: product.productId,
            quantity: product.quantity
          });
          await this.stockToProductRepository.save(newStp);
        }
      }
      stock.date = updateStock.date;
      await this.stockRepository.save(stock);
      return await this.stockRepository.findOne({ where: {id}, relations: ['stockToProduct', 'stockToProduct.product'] });
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error deleting stock');
    }
  }

  async remove(id: number) {
    try {
      const stock = await this.findById(id);
      for (const stp of stock.stockToProduct) {
        await this.stockToProductRepository.delete(stp.id);
      }
      await this.stockRepository.delete(stock.id);
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error deleting stock');
    }
  }

}