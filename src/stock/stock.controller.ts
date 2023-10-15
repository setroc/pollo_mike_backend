import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { StockService } from './stock.service';
import { CreateStockDto, UpdateStockDto } from './dto';

@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService : StockService
  ){}


  @Post('register')
  create(@Body() createStockDto : CreateStockDto) {
    return this.stockService.create(createStockDto);
  }

  @Get('all')
  findAll() {
    return this.stockService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id : number) {
    return this.stockService.findById(id);
  }

  @Patch('edit/:id')
  update(@Param('id', ParseIntPipe) id : number, @Body() updateStockDto : UpdateStockDto) {
    return this.stockService.update(id, updateStockDto);
  }

  @Delete('delete/:id')
  remove(@Param('id', ParseIntPipe) id : number) {
    return this.stockService.remove(id);
  }

}
