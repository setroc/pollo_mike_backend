import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Product } from 'src/products/entities/product.entity';

import { CreateOrderDto, OrderProductDto, UpdateOrderDto } from './dto';
import { Order } from './entities/order.entity';
import { OrderToProduct } from './entities/order-product.entity';

@Injectable()
export class OrdersService {

  constructor(
    @InjectRepository(Product) private readonly productRepository : Repository<Product>,
    @InjectRepository(Order) private readonly orderRepository : Repository<Order>,
    @InjectRepository(OrderToProduct) private readonly orderToProductRepository : Repository<OrderToProduct>,
    private readonly dataSource : DataSource
  ) {}

  async create( { products, clientName, number } : CreateOrderDto) : Promise<Order> {
    try {
      // calculate total
      const total = await this.calculateTotal(products);
      // insert order
      const order = this.orderRepository.create({clientName, number, total});
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

  async update( id : number, { products, clientName, number } : UpdateOrderDto ) : Promise<Order> {
    try {
      const order = await this.findById(id);
      // update orderToProducts
      await this.updateOrderToProducts(id, products);
      // update order
      order.clientName = clientName;
      order.number = number;
      order.total = await this.calculateTotal(products);
      await this.orderRepository.save(order);
      return order;
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
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
}
