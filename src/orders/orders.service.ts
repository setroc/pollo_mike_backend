import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Product } from 'src/products/entities/product.entity';

import { CreateOrderDto, ProductsInOrderDto, UpdateOrderDto } from './dto';
import { Order } from './entities/order.entity';
import { OrderToProduct } from './entities/order-product.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { StockToProduct } from 'src/stock/entities/stock-product.entity';
import { IOrder, IProducInOrder } from './interfaces';

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

  async create( { products, clientName, number, date, state } : CreateOrderDto) : Promise<IOrder> {
    try {
      // validate if producst exists and have stock
      for( const p of products) {
        const product = await this.productRepository.findOne({ where: { id: p.id } });
        if ( !product ) throw new NotFoundException(`Producto con ID ${ p.id } no encontrado.`);
        const haveStock = await this.checkStockOfProduct(p.id, p.quantity, date);
        if (!haveStock) throw new BadRequestException(`No hay stock en el producto  ${product.title}.`);
      }
      // calculate total
      const total = await this.calculateTotal(products);
      // insert order
      const order = this.orderRepository.create({clientName, number, total, date, state});
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
      return await this.findById(order.id);
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  async findAll () : Promise<IOrder[]> {
    const ordersRaw : any[] = await this.dataSource.manager
    .createQueryBuilder(Order, 'orders')
    .select([
      'orders.id as id',
      'orders.clientName as clientName',
      'orders.number as number',
      'orders.total as total',
      'CONVERT_TZ(orders.date, "UTC", "America/Mexico_City") as date',
      'orders.state as state',
    ]).getRawMany();
    const orders : IOrder[] = ordersRaw.map( (o:any) => {
      return {
        id: o.id,
        clientName: o.clientName,
        date: o.date,
        number: Number(o.number),
        state: Number(o.state),
        total: Number(o.total),
        products: [],
      }
    });
    for (let i=0; i<orders.length; i++) {
      const productsInOrderRaw : any[] = await this.dataSource.manager
      .createQueryBuilder(OrderToProduct, 'orders_products')
      .innerJoin('orders_products.product', 'products')
      .select([
        'products.id as id', 
        'products.title as title', 
        'products.price as price', 
        'products.description as description',
        'products.stepQuantity as stepQuantity',
        'products.type as type',
        'products.imgName as imgName',
        'orders_products.quantity as quantity',
      ])
      .where('orders_products.orderId = :id', { id: orders[i].id }).getRawMany();
      const productsInOrder : IProducInOrder[] = productsInOrderRaw.map( (p:any) => {
        return {
          id: Number(p.id),
          title: p.title,
          description: p.description,
          price: Number(p.price),
          quantity: Number(p.quantity),
          stepQuantity: Number(p.stepQuantity),
          imgName: p.imgName,
          type: p.type
        }
      });
      orders[i].products = productsInOrder;
    }
    return orders;
  }

  async findById( id : number ) : Promise<IOrder> {
    const orderRaw : any = await this.dataSource.manager
    .createQueryBuilder(Order, 'orders')
    .select([
      'orders.id as id',
      'orders.clientName as clientName',
      'orders.number as number',
      'orders.total as total',
      'CONVERT_TZ(orders.date, "UTC", "America/Mexico_City") as date',
      'orders.state as state',
    ])
    .where('orders.id = :id', { id }).getRawOne();
    if (!orderRaw) throw new NotFoundException(`Orden con ID ${ id } no encontrada.`);
    const productsInOrderRaw : any[] = await this.dataSource.manager
    .createQueryBuilder(OrderToProduct, 'orders_products')
    .innerJoin('orders_products.product', 'products')
    .select([
      'products.id as id', 
      'products.title as title', 
      'products.price as price', 
      'products.description as description',
      'products.stepQuantity as stepQuantity',
      'products.type as type',
      'products.imgName as imgName',
      'orders_products.quantity as quantity',
    ])
    .where('orders_products.orderId = :id', {id}).getRawMany();
    if (!productsInOrderRaw) throw new NotFoundException(`Productos en orden con ID ${ id } no encontrados.`);
    const products : IProducInOrder[] = productsInOrderRaw.map((p:any) => {
      return {
        id: Number(p.id),
        title: p.title,
        description: p.description,
        price: Number(p.price),
        quantity: Number(p.quantity),
        stepQuantity: Number(p.stepQuantity),
        imgName: p.imgName,
        type: p.type
      }
    });
    const order : IOrder = {
      id: orderRaw.id,
      clientName: orderRaw.clientName,
      date: orderRaw.date,
      number: Number(orderRaw.number),
      state: Number(orderRaw.state),
      total: Number(orderRaw.total),
      products
    }
    console.log(order);
    return order;
  }

  async findByDateOrState ( date : string, state: number ) : Promise<IOrder[]> {
    let ordersRaw : any[] = [];
    if (!state) { // todas las orders
      ordersRaw = await this.dataSource.manager
      .createQueryBuilder(Order, 'orders')
      .select([
        'orders.id as id',
        'orders.clientName as clientName',
        'orders.number as number',
        'orders.total as total',
        'CONVERT_TZ(orders.date, "UTC", "America/Mexico_City") as date',
        'orders.state as state',
      ])
      .where('DATE(orders.date) = :date',{date:date.split('T')[0]}).getRawMany();
    } else { // todas las ordes dependiendo del state
      ordersRaw = await this.dataSource.manager
      .createQueryBuilder(Order, 'orders')
      .select([
        'orders.id as id',
        'orders.clientName as clientName',
        'orders.number as number',
        'orders.total as total',
        'CONVERT_TZ(orders.date, "UTC", "America/Mexico_City") as date',
        'orders.state as state',
      ])
      .where('DATE(orders.date) = :date',{date:date.split('T')[0]})
      .andWhere('orders.state = :state',{state}).getRawMany();
    }
    const orders : IOrder[] = ordersRaw.map( (o:any) => {
      return {
        id: o.id,
        clientName: o.clientName,
        date: o.date,
        number: Number(o.number),
        state: Number(o.state),
        total: Number(o.total),
        products: [],
      }
    });
    for (let i=0; i<orders.length; i++) {
      const productsInOrderRaw : any[] = await this.dataSource.manager
      .createQueryBuilder(OrderToProduct, 'orders_products')
      .innerJoin('orders_products.product', 'products')
      .select([
        'products.id as id', 
        'products.title as title', 
        'products.price as price', 
        'products.description as description',
        'products.stepQuantity as stepQuantity',
        'products.type as type',
        'products.imgName as imgName',
        'orders_products.quantity as quantity',
      ])
      .where('orders_products.orderId = :id', { id: orders[i].id }).getRawMany();
      const productsInOrder : IProducInOrder[] = productsInOrderRaw.map( (p:any) => {
        return {
          id: Number(p.id),
          title: p.title,
          description: p.description,
          price: Number(p.price),
          quantity: Number(p.quantity),
          stepQuantity: Number(p.stepQuantity),
          imgName: p.imgName,
          type: p.type
        }
      });
      orders[i].products = productsInOrder;
    }
    return orders;
  } 

  async updateState( id: number, state: number ) {
    try {
      const order = await this.findById(id);
      /*
        0 - apartado
        1 - en curso
        2 - entregado
      */
      if ( state < 0 || state > 2 ) throw new BadRequestException('El estado de la orden no es correcto.');
      order.state = state;
      await this.orderRepository.save(order);
      return order;
    } catch( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al actualizar el estado de la orden.');
    } 
  } 

  async update( id : number, { products, clientName, number, date, state } : UpdateOrderDto ) : Promise<IOrder> {
    try {
      // validate if order exists
      const order = await this.orderRepository.findOne({ where: { id }});
      if (!order) throw new NotFoundException(`Orden con ID ${ id } no encontrada.`);
      // validate if producst exists and have stock
      for( const p of products) {
        const product = await this.productRepository.findOne({ where: { id: p.id } });
        if ( !product ) throw new NotFoundException(`Producto con ID ${ p.id } en la orden no encontrado.`);
        const haveStock = await this.checkStockOfProduct(p.id, p.quantity, date, id);
        if (!haveStock) throw new BadRequestException(`No hay stock en el producto  ${product.title}.`);
      }
      // update orderToProducts
      await this.updateOrderToProducts(id, products);
      // update order
      const total = await this.calculateTotal(products);
      await this.dataSource.manager
      .createQueryBuilder(Order, 'orders')
      .update()
      .set({
        clientName,
        number,
        date,
        total,
        state
      })
      .where('orders.id = :id', { id })
      .execute();
      return await this.findById(id);
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error actualizando orden');
    }
  }

  async remove ( id : number ) {
    try {
      const order = await this.findById(id);
      // delete products in table orderToProducts
      for( let i=0; i<order.products.length; i++) {
        await this.dataSource.manager
        .createQueryBuilder(OrderToProduct, 'orders_products')
        .delete()
        .where('orders_products.orderId = :id', { id:order.id })
        .execute();
      }
      // delete order 
      await this.dataSource.manager
      .createQueryBuilder(Order, 'orders')
      .delete()
      .where('orders.id = :id', { id:order.id })
      .execute();
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error eliminando orden');
    }
  }


  // function to calculate the total of the order
  private async calculateTotal(products : ProductsInOrderDto[]) : Promise<number> {
    if ( products.length === 0 ) return 0;
    let total = 0;
    for ( let i=0; i<products.length; i++) {
      const product = await this.productRepository.findOne({ where: { id:products[i].id } });
      if ( !product ) throw new NotFoundException(`Producto con ID ${ products[i].id } no encontrado.`);
      total += (product.price * products[i].quantity);
    }
    return total;
  }

  private async updateOrderToProducts(id: number, products: ProductsInOrderDto[]) {
    try {
      const orderToProducts = await this.orderToProductRepository.findBy({ orderId: id });
      if ( !orderToProducts ) throw new NotFoundException(`Orden con ID ${ id } no encontrada.`);

      // delete products in ordertoproduct not included in products
      const idOrderToProductToDelete = [];
      const productsIdToUpdate = products.reduce((a,b)=>[...a, b.id], []);
      orderToProducts.forEach( o => {
        if (!productsIdToUpdate.includes(o.productId)) idOrderToProductToDelete.push(o.id);
      });
      await this.orderToProductRepository.delete({ id: In(idOrderToProductToDelete) });
      // update and add new products
      for(const product of products) {
        const otop = await this.orderToProductRepository.findOne({ where: { orderId: id, productId: product.id }});
        if ( otop ) { // update product
          otop.quantity = product.quantity;
          await this.orderToProductRepository.save(otop);
        } else { // not found, add the product
          // validate if product exists in products
          const p = await this.productRepository.findOne({ where: { id: product.id }});
          if (!p) throw new NotFoundException(`Producto con ID ${ product.id } en la orden con ID ${ id } no existe.`);
          const newOrderToProduct = this.orderToProductRepository.create({
            productId: product.id,
            orderId: id,
            quantity: product.quantity,
          });
          await this.orderToProductRepository.save(newOrderToProduct);
        }
      }
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Error actualizando products en la orden con ID ${id}`);
    }
  } 

  private async checkStockOfProduct(productId: number, quantity: number, date: string, orderId?: number) : Promise<boolean> {
    try {
      // obtain the stock of the product
      const stock = await this.stockRepository.findOne({ where : { date : date.split('T')[0] } });
      if ( !stock ) throw new NotFoundException(`Stock en la fecha ${date.split('T')[0]} no encontrado.`);
      const productStock = await this.stockToProductRepository.findOne({ where: { stockId: stock.id, productId } });
      if ( !productStock ) throw new NotFoundException(`Producto con ID ${productId} no encontrado en el stock de la fecha ${date}.`);
      const productStockQuantity = productStock.quantity;
      // obtain the number of product in orders
      const orders = await this.dataSource.manager.createQueryBuilder(Order, 'orders').select('orders.id as id').where('DATE(orders.date) = :date',{date:date.split('T')[0]}).getRawMany();
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
      if (!!orderId) {
        const otp = await this.orderToProductRepository.findOne({ where: { orderId } });
        if (!otp) throw new NotFoundException(`Orden con ID ${orderId} no encontrada.`);
        if ( (quantity + quantityInOrders - otp.quantity) > productStockQuantity) return false;
        return true;
      }
      // CREATE
      if ( (quantity + quantityInOrders) > productStockQuantity) return false;
      return true;
    } catch( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Error mientras se checaba el stock.`);
    }
  }
}
