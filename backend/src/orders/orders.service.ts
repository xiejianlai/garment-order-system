import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, UpdateTaStageDto } from './dto/create-order.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';

const TA_STAGE_TEMPLATES = [
  { stageCategory: 'sampling', stageCode: 'proto', stageName: '初样 (Proto)', sortOrder: 1 },
  { stageCategory: 'sampling', stageCode: 'pps', stageName: '产前样 (PPS)', sortOrder: 2 },
  { stageCategory: 'sampling', stageCode: 'confirmed', stageName: '确认样', sortOrder: 3 },
  { stageCategory: 'production', stageCode: 'cutting', stageName: '裁剪 (Cutting)', sortOrder: 4 },
  { stageCategory: 'production', stageCode: 'sewing', stageName: '车缝 (Sewing)', sortOrder: 5 },
  { stageCategory: 'production', stageCode: 'packing', stageName: '后整包装 (Packing)', sortOrder: 6 },
  { stageCategory: 'inspection', stageCode: 'dupro', stageName: '中期检验 (Dupro)', sortOrder: 7 },
  { stageCategory: 'inspection', stageCode: 'fri', stageName: '尾期检验 (FRI)', sortOrder: 8 },
  { stageCategory: 'inspection', stageCode: 'report', stageName: '验货报告', sortOrder: 9 },
  { stageCategory: 'shipping', stageCode: 'booking', stageName: '订舱', sortOrder: 10 },
  { stageCategory: 'shipping', stageCode: 'loading', stageName: '装柜', sortOrder: 11 },
  { stageCategory: 'shipping', stageCode: 'etd', stageName: '离港 (ETD)', sortOrder: 12 },
  { stageCategory: 'shipping', stageCode: 'eta', stageName: '到港 (ETA)', sortOrder: 13 },
];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger('OrdersService');

  constructor(private prisma: PrismaService) {}

  /**
   * 创建订单 — 自由输入理单/跟单名字 + 自动关联已注册用户ID
   */
  async createOrder(dto: CreateOrderDto, user: JwtPayload) {
    const totalQty = dto.colorSizes.reduce((sum, item) => sum + item.quantity, 0);
    const companyId = BigInt(user.companyId);

    // 智能匹配：如果输入的名字匹配已注册用户，自动关联ID
    let coordinatorId: bigint | null = dto.coordinatorId ? BigInt(dto.coordinatorId) : null;
    let merchandiserId: bigint | null = dto.merchandiserId ? BigInt(dto.merchandiserId) : null;

    if (!coordinatorId && dto.coordinatorName) {
      const matched = await this.prisma.sysUser.findFirst({
        where: { companyId, realName: dto.coordinatorName, role: 'coordinator', status: 1 },
      });
      if (matched) coordinatorId = matched.id;
    }
    if (!merchandiserId && dto.merchandiserName) {
      const matched = await this.prisma.sysUser.findFirst({
        where: { companyId, realName: dto.merchandiserName, role: 'merchandiser', status: 1 },
      });
      if (matched) merchandiserId = matched.id;
    }

    // 理单角色自动分配自己
    if (user.role === 'coordinator') {
      coordinatorId = BigInt(user.userId);
      if (!dto.coordinatorName) dto.coordinatorName = user.realName;
    }

    // 智能匹配或创建客户：根据 customerName 查找/创建客户
    let customerId: bigint = BigInt(1); // 兜底，先尝试查找
    const customerName = dto.customerName.trim();
    if (customerName) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { companyId, customerName },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await this.prisma.customer.create({
          data: {
            companyId,
            customerCode: 'CUST-' + Date.now().toString().slice(-6),
            customerName,
          },
        });
        customerId = newCustomer.id;
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          companyId,
          orderNo: dto.orderNo,
          customerName,
          customerId,
          styleNo: dto.styleNo,
          styleName: dto.styleName,
          season: dto.season,
          category: dto.category,
          garmentImageUrl: dto.garmentImageUrl,
          totalQty,
          deliveryDate: new Date(dto.deliveryDate),
          factoryName: dto.factoryName,
          factoryId: null, // 后续改为动态查找
          coordinatorId,
          coordinatorName: dto.coordinatorName || '未分配',
          merchandiserId,
          merchandiserName: dto.merchandiserName || '未分配',
          orderStatus: 'draft',
          createdBy: BigInt(user.userId),
        },
      });

      // 批量创建颜色尺码矩阵
      await tx.orderColorSize.createMany({
        data: dto.colorSizes.map((item, index) => ({
          orderId: newOrder.id,
          color: item.color,
          colorCode: item.colorCode || null,
          size: item.size,
          sizeGroup: item.sizeGroup || null,
          quantity: item.quantity,
          rowColor: item.rowColor || null,
          sortOrder: index,
        })),
      });

      // 自动初始化 13 个 T&A 阶段
      await tx.orderTaStage.createMany({
        data: TA_STAGE_TEMPLATES.map((tpl) => ({
          orderId: newOrder.id,
          stageCategory: tpl.stageCategory,
          stageCode: tpl.stageCode,
          stageName: tpl.stageName,
          sortOrder: tpl.sortOrder,
        })),
      });

      // 创建操作日志
      const coordTag = coordinatorId ? '' : '（待注册）';
      const merTag = merchandiserId ? '' : '（待注册）';
      await tx.operationLog.create({
        data: {
          orderId: newOrder.id,
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'order',
          action: 'create',
          changeSummary: `创建订单 ${dto.orderNo}，总数量 ${totalQty.toLocaleString()} 件，理单: ${dto.coordinatorName || '未分配'}${coordTag}，跟单: ${dto.merchandiserName || '未分配'}${merTag}`,
        },
      });

      return newOrder;
    });

    this.logger.log(`订单创建: ${dto.orderNo} → 公司 ${user.companyId}`);
    return this.serializeOrder(order);
  }

  /**
   * 获取订单列表 — 角色过滤 + 数据隔离
   */
  async getOrderList(user: JwtPayload, status?: string, page?: number, limit?: number) {
    const companyId = BigInt(user.companyId);
    const where: any = { companyId };

    // 角色过滤：理单只看自己负责的，跟单只看自己负责的
    if (user.role === 'coordinator') {
      where.OR = [
        { coordinatorId: BigInt(user.userId) },
        { coordinatorName: user.realName, coordinatorId: null },
      ];
    } else if (user.role === 'merchandiser') {
      where.OR = [
        { merchandiserId: BigInt(user.userId) },
        { merchandiserName: user.realName, merchandiserId: null },
      ];
    } else if (user.role === 'customer') {
      where.customerId = BigInt(user.customerId || 0);
    }
    // admin 看全部

    if (status) where.orderStatus = status;

    const skip = ((page || 1) - 1) * (limit || 20);
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          colorSizes: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit || 20,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      list: orders.map(o => this.serializeOrder(o)),
      total,
      page: page || 1,
      limit: limit || 20,
    };
  }

  /**
   * 获取订单详情 — 全量关联
   */
  async getOrderDetail(orderId: number, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      include: {
        company: true,
        customer: true,
        factory: true,
        coordinator: true,
        merchandiser: true,
        creator: true,
        colorSizes: { orderBy: { sortOrder: 'asc' } },
        fabrics: true,
        trims: { include: { supplier: true } },
        taStages: { orderBy: { sortOrder: 'asc' } },
        logs: { orderBy: { createdAt: 'desc' }, take: 50 },
        files: true,
      },
    });

    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException('无权查看此订单');

    // 权限检查：理单/跟单只能看自己负责的订单
    if (user.role === 'coordinator') {
      const isMine = Number(order.coordinatorId) === user.userId || order.coordinatorName === user.realName;
      if (!isMine) throw new ForbiddenException('无权查看此订单');
    }
    if (user.role === 'merchandiser') {
      const isMine = Number(order.merchandiserId) === user.userId || order.merchandiserName === user.realName;
      if (!isMine) throw new ForbiddenException('无权查看此订单');
    }

    return this.serializeOrderDetail(order);
  }

  /**
   * 更新订单信息 — 支持编辑基础信息 + 重新分配理单/跟单
   */
  async updateOrder(orderId: number, dto: UpdateOrderDto, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException();

    // 权限：管理员 或 被分配的理单
    const canEdit = user.role === 'admin' ||
      (user.role === 'coordinator' && (Number(order.coordinatorId) === user.userId || order.coordinatorName === user.realName));
    if (!canEdit) throw new ForbiddenException('无编辑权限');

    const changes: string[] = [];

    // 智能匹配新分配的理单/跟单
    let coordinatorId = dto.coordinatorId ? BigInt(dto.coordinatorId) : order.coordinatorId;
    let merchandiserId = dto.merchandiserId ? BigInt(dto.merchandiserId) : order.merchandiserId;
    let coordinatorName = dto.coordinatorName || order.coordinatorName;
    let merchandiserName = dto.merchandiserName || order.merchandiserName;

    if (dto.coordinatorName && !dto.coordinatorId) {
      const matched = await this.prisma.sysUser.findFirst({
        where: { companyId: BigInt(user.companyId), realName: dto.coordinatorName, role: 'coordinator' },
      });
      if (matched) coordinatorId = matched.id;
      else coordinatorId = null;
    }
    if (dto.merchandiserName && !dto.merchandiserId) {
      const matched = await this.prisma.sysUser.findFirst({
        where: { companyId: BigInt(user.companyId), realName: dto.merchandiserName, role: 'merchandiser' },
      });
      if (matched) merchandiserId = matched.id;
      else merchandiserId = null;
    }

    // 记录变更
    if (order.orderNo !== dto.orderNo && dto.orderNo) changes.push(`订单号: ${order.orderNo} → ${dto.orderNo}`);
    if (order.styleNo !== dto.styleNo && dto.styleNo) changes.push(`款号: ${order.styleNo} → ${dto.styleNo}`);
    if (order.coordinatorName !== coordinatorName) changes.push(`理单: ${order.coordinatorName || '未分配'} → ${coordinatorName}`);
    if (order.merchandiserName !== merchandiserName) changes.push(`跟单: ${order.merchandiserName || '未分配'} → ${merchandiserName}`);

    const updateData: any = {};
    if (dto.orderNo) updateData.orderNo = dto.orderNo;
    if (dto.styleNo) updateData.styleNo = dto.styleNo;
    if (dto.styleName) updateData.styleName = dto.styleName;
    if (dto.season) updateData.season = dto.season;
    if (dto.category) updateData.category = dto.category;
    if (dto.garmentImageUrl) updateData.garmentImageUrl = dto.garmentImageUrl;
    if (dto.customerName) updateData.customerName = dto.customerName;
    if (dto.factoryName) updateData.factoryName = dto.factoryName;
    if (dto.deliveryDate) updateData.deliveryDate = new Date(dto.deliveryDate);
    updateData.coordinatorId = coordinatorId;
    updateData.coordinatorName = coordinatorName;
    updateData.merchandiserId = merchandiserId;
    updateData.merchandiserName = merchandiserName;

    // 更新颜色尺码矩阵
    let newTotalQty = order.totalQty;
    if (dto.colorSizes && dto.colorSizes.length > 0) {
      newTotalQty = dto.colorSizes.reduce((sum, item) => sum + item.quantity, 0);
      updateData.totalQty = newTotalQty;
      if (order.totalQty !== newTotalQty) changes.push(`总数量: ${order.totalQty.toLocaleString()} → ${newTotalQty.toLocaleString()}`);

      await this.prisma.orderColorSize.deleteMany({ where: { orderId: BigInt(orderId) } });
      await this.prisma.orderColorSize.createMany({
        data: dto.colorSizes.map((item, index) => ({
          orderId: BigInt(orderId),
          color: item.color,
          colorCode: item.colorCode || null,
          size: item.size,
          sizeGroup: item.sizeGroup || null,
          quantity: item.quantity,
          rowColor: item.rowColor || null,
          sortOrder: index,
        })),
      });
    }

    await this.prisma.order.update({
      where: { id: BigInt(orderId) },
      data: updateData,
    });

    if (changes.length > 0) {
      await this.prisma.operationLog.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'order',
          action: 'update',
          changeSummary: changes.join('；'),
        },
      });
    }

    return { updated: true, changes };
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId: number, dto: UpdateOrderStatusDto, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) throw new NotFoundException();

    const oldStatus = order.orderStatus;
    await this.prisma.order.update({
      where: { id: BigInt(orderId) },
      data: { orderStatus: dto.orderStatus },
    });

    await this.prisma.operationLog.create({
      data: {
        orderId: BigInt(orderId),
        userId: BigInt(user.userId),
        userName: user.realName,
        userRole: user.role,
        module: 'order',
        action: 'status_change',
        changeSummary: `订单状态: ${oldStatus} → ${dto.orderStatus}`,
      },
    });

    return { updated: true };
  }

  /**
   * 更新 T&A 阶段
   */
  async updateTaStage(orderId: number, stageCode: string, dto: UpdateTaStageDto, user: JwtPayload) {
    const stage = await this.prisma.orderTaStage.findUnique({
      where: { orderId_stageCode: { orderId: BigInt(orderId), stageCode } },
    });
    if (!stage) throw new NotFoundException('T&A阶段不存在');

    const changes: string[] = [];
    const updateData: any = { updatedBy: BigInt(user.userId) };

    if (dto.status && dto.status !== stage.status) {
      changes.push(`${stage.stageName} 状态: ${stage.status} → ${dto.status}`);
      updateData.status = dto.status;
    }
    if (dto.completionPct !== undefined && dto.completionPct !== stage.completionPct) {
      changes.push(`${stage.stageName} 进度: ${stage.completionPct}% → ${dto.completionPct}%`);
      updateData.completionPct = dto.completionPct;
    }
    if (dto.plannedDate) {
      updateData.plannedDate = new Date(dto.plannedDate);
      changes.push(`${stage.stageName} 计划日期: ${dto.plannedDate}`);
    }
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
      changes.push(`${stage.stageName} 开始日期: ${dto.startDate}`);
    }
    if (dto.actualDate) {
      updateData.actualDate = new Date(dto.actualDate);
      changes.push(`${stage.stageName} 完成日期: ${dto.actualDate}`);
    }
    // 智能预填：切换到"进行中"自动填开始日期，切换到"已完成"自动填完成日期
    if (dto.status === 'in_progress' && !dto.startDate) {
      updateData.startDate = new Date();
      changes.push(`${stage.stageName} 自动开始日期: ${new Date().toISOString().split('T')[0]}`);
    }
    if (dto.status === 'completed' && !dto.actualDate) {
      updateData.actualDate = new Date();
      changes.push(`${stage.stageName} 自动完成日期: ${new Date().toISOString().split('T')[0]}`);
    }

    await this.prisma.orderTaStage.update({
      where: { id: stage.id },
      data: updateData,
    });

    if (changes.length > 0) {
      await this.prisma.operationLog.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'ta_stage',
          action: 'update',
          changeSummary: changes.join('；'),
        },
      });
    }

    return { updated: true, changes };
  }

  /**
   * 获取下拉选项（客户、工厂列表）
   */
  async getOptions(user: JwtPayload) {
    const companyId = BigInt(user.companyId);
    const customers = await this.prisma.customer.findMany({
      where: { companyId, status: 1 },
      select: { id: true, customerCode: true, customerName: true },
    });
    const factories = await this.prisma.factory.findMany({
      where: { companyId, status: 1 },
      select: { id: true, factoryCode: true, factoryName: true, factoryType: true },
    });
    const coordinators = await this.prisma.sysUser.findMany({
      where: { companyId, role: 'coordinator', status: 1 },
      select: { id: true, realName: true },
    });
    const merchandisers = await this.prisma.sysUser.findMany({
      where: { companyId, role: 'merchandiser', status: 1 },
      select: { id: true, realName: true },
    });

    return {
      customers: customers.map(c => ({ id: Number(c.id), code: c.customerCode, name: c.customerName })),
      factories: factories.map(f => ({ id: Number(f.id), code: f.factoryCode, name: f.factoryName, type: f.factoryType })),
      coordinators: coordinators.map(c => ({ id: Number(c.id), name: c.realName })),
      merchandisers: merchandisers.map(m => ({ id: Number(m.id), name: m.realName })),
    };
  }

  // ========== 序列化辅助 ==========

  private serializeOrder(order: any) {
    return {
      id: Number(order.id),
      companyId: Number(order.companyId),
      orderNo: order.orderNo,
      customerName: order.customerName,
      customerId: Number(order.customerId),
      styleNo: order.styleNo,
      styleName: order.styleName,
      season: order.season,
      category: order.category,
      totalQty: order.totalQty,
      deliveryDate: order.deliveryDate?.toISOString().split('T')[0],
      factoryName: order.factoryName,
      coordinatorId: order.coordinatorId ? Number(order.coordinatorId) : null,
      coordinatorName: order.coordinatorName,
      merchandiserId: order.merchandiserId ? Number(order.merchandiserId) : null,
      merchandiserName: order.merchandiserName,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt?.toISOString(),
    };
  }

  private serializeOrderDetail(order: any) {
    const isCoordRegistered = order.coordinatorId && order.coordinator;
    const isMerRegistered = order.merchandiserId && order.merchandiser;

    return {
      ...this.serializeOrder(order),
      garmentImageUrl: order.garmentImageUrl,
      coordinatorRegistered: !!isCoordRegistered,
      merchandiserRegistered: !!isMerRegistered,
      colorSizes: order.colorSizes?.map(cs => ({
        id: Number(cs.id),
        color: cs.color,
        colorCode: cs.colorCode,
        size: cs.size,
        quantity: cs.quantity,
        rowColor: cs.rowColor,
      })) || [],
      fabrics: order.fabrics?.map(f => ({
        id: Number(f.id),
        fabricName: f.fabricName,
        color: f.color,
        specification: f.specification,
        usagePerPiece: Number(f.usagePerPiece),
        totalDemand: f.totalDemand,
        supplierName: f.supplierName,
        status: f.status,
        qtyCheckStatus: f.qtyCheckStatus,
        plannedDate: f.plannedDate?.toISOString().split('T')[0],
        actualDate: f.actualDate?.toISOString().split('T')[0],
      })) || [],
      trims: order.trims?.map(t => ({
        id: Number(t.id),
        trimName: t.trimName,
        trimCategory: t.trimCategory,
        color: t.color,
        specification: t.specification,
        usagePerPiece: Number(t.usagePerPiece),
        totalDemand: t.totalDemand,
        supplierName: t.supplierName,
        samplingStatus: t.samplingStatus,
        bulkPoStatus: t.bulkPoStatus,
        qtyCheckStatus: t.qtyCheckStatus,
        inspectionResult: t.inspectionResult,
        isReady: t.isReady,
        plannedDate: t.plannedDate?.toISOString().split('T')[0],
        actualDate: t.actualDate?.toISOString().split('T')[0],
      })) || [],
      taStages: order.taStages?.map(ts => ({
        id: Number(ts.id),
        stageCategory: ts.stageCategory,
        stageCode: ts.stageCode,
        stageName: ts.stageName,
        status: ts.status,
        plannedDate: ts.plannedDate?.toISOString().split('T')[0],
        startDate: ts.startDate?.toISOString().split('T')[0],
        actualDate: ts.actualDate?.toISOString().split('T')[0],
        completionPct: ts.completionPct,
      })) || [],
      logs: order.logs?.map(log => ({
        id: Number(log.id),
        userName: log.userName,
        userRole: log.userRole,
        module: log.module,
        action: log.action,
        changeSummary: log.changeSummary,
        createdAt: log.createdAt.toISOString(),
      })) || [],
    };
  }
}
