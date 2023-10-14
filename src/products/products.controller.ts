import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

import { CreateProductDto, UdpateProductDto } from './dto';

@Controller('products')
export class ProductsController {

  constructor(
    private readonly productService : ProductsService
  ) {}

  @Post('register')
  create(@Body() createProductDto : CreateProductDto ) {
    return this.productService.create(createProductDto);
  }

  @Get('all')
  findAll() {
    return this.productService.findAll();
  }
  
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id : number ) {
    return this.productService.findById(id);
  }

  @Patch('edit/:id')
  update(@Param('id', ParseIntPipe) id : number, @Body() updateProductDto: UdpateProductDto ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete('delete/:id')
  remove(@Param('id', ParseIntPipe) id : number ) {
    return this.productService.remove(id);
  }
}
