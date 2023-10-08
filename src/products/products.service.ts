import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto, UdpateProductDto } from './dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {

  constructor(@InjectRepository(Product) private readonly productRepository : Repository<Product > ) {}

  async create ( product : CreateProductDto) : Promise<Product> { 
    try {
      const newProduct = this.productRepository.create(product);
      await this.productRepository.save(newProduct);
      return newProduct;
    } catch ( error ) {
      console.log(error);
      throw new BadRequestException(error.detail);
    }
  }

  async findAll () : Promise<Product[]> {
    return this.productRepository.find();
  }

  async findById ( id : number ) : Promise<Product> {
    const product = await this.productRepository.findOne({ where: {id} });
    if (!product) throw new NotFoundException(`Product with ID ${ id } not found`);
    return product;
  }

  async update ( product : UdpateProductDto) : Promise<Product> {
    await this.findById(product.id);
    return await this.productRepository.save(product);
  }

  async remove ( id: number )  {
    const product = await this.findById(id);
    await this.productRepository.delete(product);
  }

}
