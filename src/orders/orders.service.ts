import { Injectable, NotFoundException } from '@nestjs/common';

import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { OrderProduct } from './entities/order-product.entity';

@Injectable()
export class OrdersService {

  private fakeData : Order[] = [
    { 
      id: 1, 
      products: [
        { id: 1, quantity: 10 },
        { id: 2, quantity: 10 }
      ],
      clientName: 'Juan',
      number: 10,
      total: 1000
    }
  ]

  create( { products, clientName, number } : CreateOrderDto) : Order {
    const order = new Order(); 
    order.id = Math.max(...this.fakeData.map( o => o.id )) + 1;
    order.products = products;
    order.clientName = clientName;
    order.number = number;
    order.total = this.calculateTotal(products);
    this.fakeData.push(order);
    return order;
  }

  findAll () : Order [] {
    return this.fakeData;
  }

  findById( id : number ) : Order {
    const order = this.fakeData.find( o => o.id === id );
    if (!order) throw new NotFoundException(`Order with ID ${ id } not found`);
    return order;
  }

  update( { id, products, clientName, number } : UpdateOrderDto ) : Order {
    const order = this.findById(id);
    order.products = products;
    order.clientName = clientName;
    order.number = number;
    order.total = this.calculateTotal(products);
    this.fakeData = this.fakeData.map( o => {
      if ( o.id === id ) return order;
      return o;
    });
    return order;
  }

  remove ( id : number ) {
    this.findById(id);
    this.fakeData = this.fakeData.filter( o => o.id !== id );
  }



  // función que calcula el total de la orden
  private calculateTotal(products : OrderProduct[]) : number {
    if ( products.length === 0 ) return 0;
    // faltaria obtener el precio de un producto por su id
    let total = 0;
    products.forEach( p => {
      // Buscar el precio del producto por su id
      total += (p.quantity * 10);
    });
    return total;
  }
}
