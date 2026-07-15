import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('操作日志 Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private prisma: PrismaService) {}

  @Get(':orderId')
  @ApiOperation({ summary: '获取订单操作日志流' })
  async getOrderLogs(
    @Param('orderId') orderId: number,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 50,
  ) {
    const [logs, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where: { orderId: BigInt(orderId) },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      this.prisma.operationLog.count({
        where: { orderId: BigInt(orderId) },
      }),
    ]);

    return {
      list: logs.map((l) => ({
        ...l,
        id: Number(l.id),
        orderId: Number(l.orderId),
        userId: Number(l.userId),
        targetId: l.targetId ? Number(l.targetId) : null,
      })),
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }
}
