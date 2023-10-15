import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Product } from 'src/products/entities/product.entity';

import { CreateOrderDto, OrderProductDto, UpdateOrderDto } from './dto';
import { Order } from './entities/order.entity';
import { OrderToProduct } from './entities/order-product.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { StockToProduct } from 'src/stock/entities/stock-product.entity';

@Injectable()
export class OrdersService {

  constructor(
    @InjectRepository(Product) private readonly productRepository : Repository<Product>,
    @InjectRepository(Order) private readonly orderRepository : Repository<Order>,
    @InjectRepository(OrderToProduct) private readonly orderToProductRepository : Repository<OrderToProduct>,
    @InjectRepository(Stock) private readonly stockRepository : Repository<Stock>,
    @InjectRepository(StockToProduct) private readonly stockToProductRepository : Repository<StockToProduct>,
    private readonly dataSource : DataSource
  ) {}

  async create( { products, clientName, number, date } : CreateOrderDto) : Promise<Order> {
    try {
      // validate if producst exists and have stock
      for( const p of products) {
        const product = await this.productRepository.findOne({ where: { id: p.productId } });
        if ( !product ) throw new NotFoundException(`Product with ID ${ p.productId } in order not found.`);
        const haveStock = await this.checkStockOfProduct(p.productId, p.quantity, date);
        if (!haveStock) throw new BadRequestException(`Doesnt have stock in product with ID ${p.productId}.`);
      }
      // calculate total
      const total = await this.calculateTotal(products);
      // insert order
      const order = this.orderRepository.create({clientName, number, total, date, state: 0});
      await this.orderRepository.save(order);
      // insert orderToProducts
      for ( let i=0; i<products.length; i++ ) {
        const orderToProduct = this.orderToProductRepository.create({
          productId: products[i].productId,
          orderId: order.id,
          quantity: products[i].quantity,
        });
        await this.orderToProductRepository.save(orderToProduct);
      }
      return order;
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  async findAll () : Promise<Order[]> {
    return await this.orderRepository.find({ relations: ['orderToProduct', 'orderToProduct.product']});
  }

  async findById( id : number ) : Promise<Order> {
    const order =  await this.orderRepository.findOne({ where: { id }, relations: ['orderToProduct', 'orderToProduct.product']});
    if (!order) throw new NotFoundException(`Order with ID ${ id } not found`);
    return order;
  }

  async updateState( id: number, state: number ) {
    try {
      const order = await this.findById(id);
      if ( state < 0 || state > 2 ) throw new BadRequestException('The state of the order isnt correct.');
      order.state = state;
      await this.orderRepository.save(order);
      return order;
    } catch( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error updating state of order');
    } 
  } 

  async update( id : number, { products, clientName, number, date } : UpdateOrderDto ) : Promise<Order> {
    try {
      // validate if producst exists and have stock
      for( const p of products) {
        const product = await this.productRepository.findOne({ where: { id: p.productId } });
        if ( !product ) throw new NotFoundException(`Product with ID ${ p.productId } in order not found.`);
        const haveStock = await this.checkStockOfProduct(p.productId, p.quantity, date, id);
        if (!haveStock) throw new BadRequestException(`Doesnt have stock in product with ID ${p.productId}.`);
      }
      await this.findById(id);
      // update orderToProducts
      await this.updateOrderToProducts(id, products);
      // update order
      const order = await this.findById(id);
      order.clientName = clientName;
      order.number = number;
      order.date = date;
      order.total = await this.calculateTotal(products);
      await this.orderRepository.save(order);
      return order;
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error updating order');
    }
  }

  async remove ( id : number ) {
    try {
      const order = await this.findById(id);
      order.orderToProduct.forEach( op => {
        this.orderToProductRepository.delete({ id: op.id });
      });
      await this.orderRepository.delete({ id });
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error deleting order');
    }
  }





  // function to calculate the total of the order
  private async calculateTotal(products : OrderProductDto[]) : Promise<number> {
    if ( products.length === 0 ) return 0;
    let total = 0;
    for ( let i=0; i<products.length; i++) {
      const product = await this.productRepository.findOne({ where: { id:products[i].productId } });
      if ( !product ) throw new NotFoundException(`Product with ID ${ products[i].productId } not found`);
      total += (product.price * products[i].quantity);
    }
    return total;
  }

  private async updateOrderToProducts(id: number, products: OrderProductDto[]) {
    try {
      const orderToProducts = await this.orderToProductRepository.findBy({ orderId: id });
      if ( !orderToProducts ) throw new NotFoundException(`Order with ID ${ id } not found`);

      // delete products in ordertoproduct not included in products
      const idOrderToProductToDelete = [];
      const productsIdToUpdate = products.reduce((a,b)=>[...a, b.productId], []);
      orderToProducts.forEach( o => {
        if (!productsIdToUpdate.includes(o.productId)) idOrderToProductToDelete.push(o.id);
      });
      await this.orderToProductRepository.delete({ id: In(idOrderToProductToDelete) });
      // update and add new products
      for(const product of products) {
        const otop = await this.orderToProductRepository.findOne({ where: { orderId: id, productId: product.productId }});
        if ( otop ) { // update product
          otop.quantity = product.quantity;
          await this.orderToProductRepository.save(otop);
        } else { // not found, add the product
          // validate if product exists in products
          const p = await this.productRepository.findOne({ where: { id: product.productId }});
          if (!p) throw new NotFoundException(`Product with ID ${ product.productId } in Order with ID ${ id } not exist`);
          const newOrderToProduct = this.orderToProductRepository.create({
            productId: product.productId,
            orderId: id,
            quantity: product.quantity,
          });
          await this.orderToProductRepository.save(newOrderToProduct);
        }
      }
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Error updating products in order with ID ${id}`);
    }
  } 

  private async checkStockOfProduct(productId: number, quantity: number, date: string, orderId?: number) : Promise<boolean> {
    try {
      // obtain the stock of the product
      const stock = await this.stockRepository.findOne({ where : { date } });
      if ( !stock ) throw new NotFoundException(`Stock in date ${date} not found.`);
      const productStock = await this.stockToProductRepository.findOne({ where: { stockId: stock.id, productId } });
      if ( !productStock ) throw new NotFoundException(`Product with ID ${productId} not found int stock in date ${date}.`);
      const productStockQuantity = productStock.quantity;
      // obtain the number of product in orders
      const orders = await this.orderRepository.find({ where: {date}, relations: ['orderToProduct', 'orderToProduct.product'] });
      if (orders.length === 0 ) { // doesnt have orders
        if ( quantity > productStockQuantity ) return false;
        return true;
      }
      const ordersIds = orders.reduce( (a,b) => [...a, b.id], []);
      const ordersToProducts = await this.orderToProductRepository.find({ where: { orderId: In(ordersIds), productId } });
      if (ordersToProducts.length === 0 ) { // doesnt have orders with the product
        if ( quantity > productStockQuantity ) return false;
        return true;
      }
      const quantityInOrders = ordersToProducts.reduce( (a,b) => Number(a) + Number(b.quantity), 0);
      // UPDATE - obtain the quantity in orden before update
      if (orderId) {
        const otp = await this.orderToProductRepository.findOne({ where: { orderId } });
        if (!otp) throw new NotFoundException(`Order with ID ${orderId} not found.`);
        if ( (quantity + quantityInOrders - otp.quantity) > productStockQuantity) return false;
        return true;
      }
      // CREATE
      if ( (quantity + quantityInOrders) > productStockQuantity) return false;
      return true;
    } catch( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Error during check the stock.`);
    }
  }
}
