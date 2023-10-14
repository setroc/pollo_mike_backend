import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
      throw new InternalServerErrorException('Error creating a product.');
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

  async update ( id : number, product : UdpateProductDto) : Promise<Product> {
    try {
      const productToUpdate = await this.findById(id);
      productToUpdate.title = product.title;
      productToUpdate.description = product.description;
      productToUpdate.price = product.price;
      return await this.productRepository.save(productToUpdate);
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error updating a product.');
    }
  }
  
  async remove ( id: number )  {
    try {
      const product = await this.findById(id);
      await this.productRepository.delete(product);
    } catch ( error ) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error deleting a product.');
    }
  }

}
