import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, UpdateTaStageDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('订单 Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '创建订单（自由输入理单/跟单名字）' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    return this.ordersService.createOrder(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取订单列表（角色过滤 + 公司数据隔离）' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getOrderList(user, status, page || 1, limit || 20);
  }

  @Get('options')
  @ApiOperation({ summary: '获取下拉选项（客户、工厂、理单、跟单）' })
  async getOptions(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getOptions(user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情（含矩阵、面料、辅料、T&A、日志）' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getOrderDetail(Number(id), user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑订单（基础信息+重新分配理单/跟单）' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: JwtPayload) {
    return this.ordersService.updateOrder(Number(id), dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新订单状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.updateOrderStatus(Number(id), dto, user);
  }

  @Patch(':id/ta-stages/:stageCode')
  @ApiOperation({ summary: '更新T&A阶段（状态+三日期+进度）' })
  async updateTaStage(
    @Param('id') id: string,
    @Param('stageCode') stageCode: string,
    @Body() dto: UpdateTaStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.updateTaStage(Number(id), stageCode, dto, user);
  }
}
