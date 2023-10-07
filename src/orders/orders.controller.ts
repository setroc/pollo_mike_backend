import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto';

@Controller('orders')
export class OrdersController {

  constructor(
    private readonly orderService : OrdersService
  ) {};

  @Post()
  create(@Body() createOrderDto : CreateOrderDto) : Order {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() : Order [] {
    return this.orderService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id : number ) : Order {
    return this.orderService.findById(id);
  }

  @Patch()
  update(@Body() updateOrderDto : UpdateOrderDto) : Order {
    return this.orderService.update(updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id : number) {
    return this.orderService.remove(id);
  }

}
