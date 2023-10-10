import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateOrderDto, OrderProductDto, UpdateOrderDto } from './dto';
import { Order } from './entities/order.entity';
import { OrderToProduct } from './entities/order-product.entity';
import { Product } from 'src/products/entities/product.entity';

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
          productId: products[i].id,
          orderId: order.id,
          quantity: products[i].quantity,
        });
        await this.orderToProductRepository.save(orderToProduct);
      }
      return order;
    } catch ( error ) {
      console.log(error);
      throw new BadRequestException(error.detail);
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

  async update( { id, products, clientName, number } : UpdateOrderDto ) : Promise<Order> {
    try {
      const order = await this.findById(id);
      order.clientName = clientName;
      order.number = number;
      order.orderToProduct.forEach( op => {
        const newProduct = products.find( np => np.id === op.id);
        if ( newProduct ) op.quantity = newProduct.quantity;
        this.orderToProductRepository.save(op);
      });
      order.total = await this.calculateTotal(products);
      await this.orderRepository.save(order);
      return order;
    } catch ( error ) {
      console.log(error);
      throw new BadRequestException(error.detail);
    }
  }

  async remove ( id : number ) {
    const order = await this.findById(id);
    order.orderToProduct.forEach( op => {
      this.orderToProductRepository.delete({ id: op.id });
    });
    await this.orderRepository.delete({ id });
  }

  // function to calculate the total of the order
  private async calculateTotal(products : OrderProductDto[]) : Promise<number> {
    if ( products.length === 0 ) return 0;
    let total = 0;
    for ( let i=0; i<products.length; i++) {
      const product = await this.productRepository.findOne({ where: { id:products[i].id } });
      if ( !product ) throw new NotFoundException(`Product with ID ${ products[i].id } not found`);
      total += (product.price * products[i].quantity);
    }
    return total;
  }
}
