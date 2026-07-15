import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

/**
 * T&A 定时任务 — 每天凌晨1点检查延误状态
 * 当 planned_date < 今天 且 status != 'completed' 时，自动标记为 delayed
 */
@Injectable()
export class TaStagesService {
  private readonly logger = new Logger('TaStagesService');

  constructor(private prisma: PrismaService) {}

  @Cron('0 1 * * *')
  async checkDelayedStages() {
    const now = new Date();
    const result = await this.prisma.orderTaStage.updateMany({
      where: {
        plannedDate: { lt: now },
        status: { not: 'completed' },
      },
      data: { status: 'delayed' },
    });

    if (result.count > 0) {
      this.logger.log(`T&A 延误检查: ${result.count} 个阶段被标记为延误`);
    }
  }
}
