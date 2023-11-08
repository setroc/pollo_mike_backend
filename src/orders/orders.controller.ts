import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto';

@Controller('orders')
export class OrdersController {

  constructor(
    private readonly orderService : OrdersService
  ) {};

  @Post('register')
  create(@Body() createOrderDto : CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }
  
  @Get('all')
  findAll(@Query('date') date : string, @Query('state') state : number) {
    if (!date && !state)
      return this.orderService.findAll();
    return this.orderService.findByDateOrState(date, state);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id : number )  {
    return this.orderService.findById(id);
  }

  @Patch('edit/:id')
  update(@Param('id', ParseIntPipe) id : number, @Body() updateOrderDto : UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch('updateState/:id/:state')
  updateState(@Param('id', ParseIntPipe) id : number,@Param('state', ParseIntPipe) state : number) {
    return this.orderService.updateState(id, state);
  }

  @Delete('delete/:id')
  remove(@Param('id', ParseIntPipe) id : number) {
    return this.orderService.remove(id);
  }

}
