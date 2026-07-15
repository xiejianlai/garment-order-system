import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { WebSocketGatewayImpl } from '../websocket/websocket.gateway';

export class CreateTrimDto {
  trimName: string;
  trimCategory: string;
  specification?: string;
  usagePerPiece: number;
  unit?: string;
  supplierId?: number;
  remark?: string;
}

export class UpdateTrimStatusDto {
  // 打样阶段
  samplingStatus?: string;
  samplingSentDate?: string;
  samplingApprovedDate?: string;
  samplingRemark?: string;
  // 大货阶段
  bulkPoNo?: string;
  bulkPoStatus?: string;
  bulkPoDate?: string;
  bulkEtd?: string;
  bulkEta?: string;
  receivedQty?: number;
  qtyCheckStatus?: string;
  inspectionResult?: string;
  inspectionNote?: string;
}

@Injectable()
export class TrimsService {
  private readonly logger = new Logger('TrimsService');

  constructor(
    private prisma: PrismaService,
    private wsGateway: WebSocketGatewayImpl,
  ) {}

  /**
   * 为订单添加辅料
   */
  async addTrim(orderId: number, dto: CreateTrimDto, user: JwtPayload) {
    // 获取订单总数量用于计算总需求
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      select: { totalQty: true },
    });
    if (!order) throw new NotFoundException('订单不存在');

    const totalDemand = Math.ceil(dto.usagePerPiece * order.totalQty);

    const trim = await this.prisma.$transaction(async (tx) => {
      const newTrim = await tx.orderTrim.create({
        data: {
          orderId: BigInt(orderId),
          trimName: dto.trimName,
          trimCategory: dto.trimCategory,
          specification: dto.specification || null,
          usagePerPiece: dto.usagePerPiece,
          unit: dto.unit || 'pcs',
          totalDemand,
          supplierId: dto.supplierId ? BigInt(dto.supplierId) : null,
          remark: dto.remark || null,
          createdBy: BigInt(user.userId),
        },
      });

      await tx.operationLog.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'trim',
          action: 'create',
          targetId: newTrim.id,
          changeSummary: `新增辅料[${dto.trimName}]，总需求量: ${totalDemand}`,
        },
      });

      return newTrim;
    });

    // WebSocket 推送
    this.wsGateway.emitLogToOrder(orderId, {
      userName: user.realName,
      userRole: user.role,
      module: 'trim',
      action: 'create',
      changeSummary: `新增辅料[${dto.trimName}]，总需求量: ${totalDemand}`,
    });

    return { id: Number(trim.id), trimName: trim.trimName, totalDemand };
  }

  /**
   * 更新辅料进度状态 — 自动判定齐套
   */
  async updateTrimStatus(trimId: number, dto: UpdateTrimStatusDto, user: JwtPayload) {
    const trim = await this.prisma.orderTrim.findUnique({
      where: { id: BigInt(trimId) },
    });
    if (!trim) throw new NotFoundException('辅料记录不存在');

    // 构建更新数据
    const updateData: any = {};
    const changes: string[] = [];

    if (dto.samplingStatus && dto.samplingStatus !== trim.samplingStatus) {
      updateData.samplingStatus = dto.samplingStatus;
      changes.push(`打样状态: ${trim.samplingStatus} → ${dto.samplingStatus}`);
    }
    if (dto.samplingSentDate) updateData.samplingSentDate = new Date(dto.samplingSentDate);
    if (dto.samplingApprovedDate) updateData.samplingApprovedDate = new Date(dto.samplingApprovedDate);
    if (dto.samplingRemark !== undefined) updateData.samplingRemark = dto.samplingRemark;

    if (dto.bulkPoNo !== undefined) updateData.bulkPoNo = dto.bulkPoNo;
    if (dto.bulkPoStatus && dto.bulkPoStatus !== trim.bulkPoStatus) {
      updateData.bulkPoStatus = dto.bulkPoStatus;
      changes.push(`大货状态: ${trim.bulkPoStatus} → ${dto.bulkPoStatus}`);
    }
    if (dto.bulkPoDate) updateData.bulkPoDate = new Date(dto.bulkPoDate);
    if (dto.bulkEtd) updateData.bulkEtd = new Date(dto.bulkEtd);
    if (dto.bulkEta) updateData.bulkEta = new Date(dto.bulkEta);
    if (dto.receivedQty !== undefined) updateData.receivedQty = dto.receivedQty;
    if (dto.qtyCheckStatus && dto.qtyCheckStatus !== trim.qtyCheckStatus) {
      updateData.qtyCheckStatus = dto.qtyCheckStatus;
      changes.push(`数量清点: ${trim.qtyCheckStatus} → ${dto.qtyCheckStatus}`);
    }
    if (dto.inspectionResult && dto.inspectionResult !== trim.inspectionResult) {
      updateData.inspectionResult = dto.inspectionResult;
      changes.push(`检验结果: ${trim.inspectionResult} → ${dto.inspectionResult}`);
    }
    if (dto.inspectionNote !== undefined) updateData.inspectionNote = dto.inspectionNote;

    // 齐套自动判定
    const newSamplingStatus = updateData.samplingStatus || trim.samplingStatus;
    const newBulkPoStatus = updateData.bulkPoStatus || trim.bulkPoStatus;
    const newQtyCheckStatus = updateData.qtyCheckStatus || trim.qtyCheckStatus;
    const newInspectionResult = updateData.inspectionResult || trim.inspectionResult;

    const isReady =
      newSamplingStatus === 'approved' &&
      newBulkPoStatus === 'received' &&
      newQtyCheckStatus === 'sufficient' &&
      newInspectionResult === 'pass';

    if (isReady && trim.isReady === 0) {
      updateData.isReady = 1;
      updateData.readyDate = new Date();
      changes.push('辅料已齐套');
    } else if (!isReady && trim.isReady === 1) {
      updateData.isReady = 0;
      updateData.readyDate = null;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orderTrim.update({
        where: { id: BigInt(trimId) },
        data: updateData,
      });

      if (changes.length > 0) {
        await tx.operationLog.create({
          data: {
            orderId: trim.orderId,
            userId: BigInt(user.userId),
            userName: user.realName,
            userRole: user.role,
            module: 'trim',
            action: 'update',
            targetId: BigInt(trimId),
            changeSummary: `辅料[${trim.trimName}]更新: ${changes.join('；')}`,
          },
        });
      }
    });

    // WebSocket 推送
    if (changes.length > 0) {
      this.wsGateway.emitLogToOrder(Number(trim.orderId), {
        userName: user.realName,
        userRole: user.role,
        module: 'trim',
        action: 'update',
        changeSummary: `辅料[${trim.trimName}]更新: ${changes.join('；')}`,
      });
      this.wsGateway.emitStatusChange(Number(trim.orderId), 'trim', {
        trimId: Number(trim.id),
        isReady,
        changes,
      });
    }

    return { id: Number(trim.id), isReady, changes };
  }

  /**
   * 一键查看辅料齐套状态
   */
  async checkTrimsReady(orderId: number) {
    const trims = await this.prisma.orderTrim.findMany({
      where: { orderId: BigInt(orderId) },
      select: {
        id: true,
        trimName: true,
        isReady: true,
        samplingStatus: true,
        bulkPoStatus: true,
        qtyCheckStatus: true,
        inspectionResult: true,
      },
    });

    const ready = trims.filter((t) => t.isReady === 1).length;
    const total = trims.length;
    const notReadyItems = trims
      .filter((t) => t.isReady === 0)
      .map((t) => ({
        id: Number(t.id),
        trimName: t.trimName,
        missingSteps: this.getMissingSteps(t),
      }));

    return {
      allReady: total > 0 && ready === total,
      readyCount: ready,
      totalCount: total,
      notReadyItems,
    };
  }

  private getMissingSteps(trim: any): string[] {
    const missing: string[] = [];
    if (trim.samplingStatus !== 'approved') missing.push('打样未确认');
    if (trim.bulkPoStatus !== 'received') missing.push('大货未到厂');
    if (trim.qtyCheckStatus !== 'sufficient') missing.push('数量未足额');
    if (trim.inspectionResult !== 'pass') missing.push('检验未合格');
    return missing;
  }
}
