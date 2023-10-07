import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto, UdpateProductDto } from './dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private fakeData: Product[] = [
    { id: 1, title: 'Ejemplo 1', description: 'Desc 1', price: 10 },
    { id: 2, title: 'Ejemplo 2', description: 'Desc 2', price: 20 },
  ];

  create ( { title, description, price } : CreateProductDto) : Product { 
    const product = new Product();
    product.id = Math.max(...this.fakeData.map( p => p.id )) + 1;
    product.title = title;
    product.description = description;
    product.price = price;
    this.fakeData.push(product);
    return product;
  }

  findAll () : Product[] {
    return this.fakeData;
  }

  findById ( id : number ) : Product {
    const product = this.fakeData.find( p  => p.id === id );
    if (!product) throw new NotFoundException(`Product with ID ${ id } not found`);
    return product;
  }

  update ( { id, title, description, price } : UdpateProductDto) : Product {
    const product = this.findById(id);
    product.title = title;
    product.description = description;
    product.price = price;
    this.fakeData = this.fakeData.map( p => {
      if ( p.id === product.id ) return product;
      return p;
    });
    return product;
  }

  remove ( id: number )  {
    this.findById(id);
    this.fakeData = this.fakeData.filter( p => p.id !== id );
  }

}
