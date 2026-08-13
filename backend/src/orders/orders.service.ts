import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, UpdateTaStageDto,
  CreateFabricDto, UpdateFabricDto, UpdateVisibilityDto,
} from './dto/create-order.dto';
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

    // 订单号唯一性预检（含软删除的订单仍占用唯一索引，一并提示）
    const dupOrder = await this.prisma.order.findFirst({
      where: { companyId, orderNo: dto.orderNo },
      select: { id: true, deletedAt: true },
    });
    if (dupOrder) {
      throw new BadRequestException(
        `订单号 ${dto.orderNo} 已存在${dupOrder.deletedAt ? '（已被删除的历史订单占用，请更换订单号）' : '，请更换订单号'}`
      );
    }

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
          sortOrder: item.sortOrder ?? index,
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
   * 获取订单列表 — 角色过滤 + 数据隔离 + 可见性控制
   * 可见性规则:
   *   - admin 看全部
   *   - coordinator/merchandiser 看自己负责的 或 被管理员显式授权(visibleUserIds)的
   *   - customer 看绑定客户的订单
   *   - 软删除(deletedAt)的订单所有人不可见
   */
  async getOrderList(user: JwtPayload, status?: string, page?: number, limit?: number) {
    const companyId = BigInt(user.companyId);
    const where: any = { companyId, deletedAt: null };

    // 角色过滤：理单只看自己负责的，跟单只看自己负责的，外加管理员授权的可见用户
    if (user.role === 'coordinator') {
      where.OR = [
        { coordinatorId: BigInt(user.userId) },
        { coordinatorName: user.realName, coordinatorId: null },
        { visibleUserIds: { has: String(user.userId) } },
      ];
    } else if (user.role === 'merchandiser') {
      where.OR = [
        { merchandiserId: BigInt(user.userId) },
        { merchandiserName: user.realName, merchandiserId: null },
        { visibleUserIds: { has: String(user.userId) } },
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
          factory: true,
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
    if (order.deletedAt) throw new NotFoundException('订单不存在');

    // 可见性检查：管理员全权；理单/跟单看自己负责的或被授权的；客户看绑定客户的；工厂按公司校验
    if (!this.canViewOrder(order, user)) {
      throw new ForbiddenException('无权查看此订单');
    }

    return this.serializeOrderDetail(order);
  }

  /**
   * 订单可见性判断
   */
  private canViewOrder(order: any, user: JwtPayload): boolean {
    if (user.role === 'admin') return true;
    if (user.role === 'customer') {
      return Number(order.customerId) === Number(user.customerId || 0);
    }
    // 显式授权用户（管理员设置）
    const viewerIds = (order.visibleUserIds || []).map((id: any) => Number(id));
    if (viewerIds.includes(Number(user.userId))) return true;
    if (user.role === 'coordinator') {
      return Number(order.coordinatorId) === Number(user.userId) ||
        (order.coordinatorName === user.realName && !order.coordinatorId);
    }
    if (user.role === 'merchandiser') {
      return Number(order.merchandiserId) === Number(user.userId) ||
        (order.merchandiserName === user.realName && !order.merchandiserId);
    }
    // factory 等其余角色：同公司即可（保持原有行为）
    return true;
  }

  /**
   * 当前用户是否该订单的负责人（理单或跟单）
   */
  private isAssignee(order: any, user: JwtPayload): boolean {
    if (user.role === 'coordinator') {
      return Number(order.coordinatorId) === Number(user.userId) ||
        (order.coordinatorName === user.realName && !order.coordinatorId);
    }
    if (user.role === 'merchandiser') {
      return Number(order.merchandiserId) === Number(user.userId) ||
        (order.merchandiserName === user.realName && !order.merchandiserId);
    }
    return false;
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

    // 订单号唯一性预检（改单号时，排除自身）
    if (dto.orderNo && dto.orderNo !== order.orderNo) {
      const dupOrder = await this.prisma.order.findFirst({
        where: { companyId: BigInt(user.companyId), orderNo: dto.orderNo, id: { not: BigInt(orderId) } },
        select: { id: true, deletedAt: true },
      });
      if (dupOrder) {
        throw new BadRequestException(
          `订单号 ${dto.orderNo} 已存在${dupOrder.deletedAt ? '（已被删除的历史订单占用，请更换订单号）' : '，请更换订单号'}`
        );
      }
    }

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
   * 权限: admin 全权；coordinator 可改自己负责的订单；跟单/客户/工厂不可改状态
   */
  async updateOrderStatus(orderId: number, dto: UpdateOrderStatusDto, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException();
    if (order.deletedAt) throw new NotFoundException('订单不存在');

    const canChange = user.role === 'admin' ||
      (user.role === 'coordinator' && this.isAssignee(order, user));
    if (!canChange) throw new ForbiddenException('无修改订单状态权限');

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
   * 权限:
   *   - admin: 全部阶段
   *   - coordinator: 自己负责订单的全部阶段（含出货）
   *   - merchandiser: 自己负责订单的非出货阶段（shipping 拒绝）
   *   - factory: 仅 production 阶段
   *   - customer: 无权限
   */
  async updateTaStage(orderId: number, stageCode: string, dto: UpdateTaStageDto, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      select: { id: true, companyId: true, deletedAt: true, coordinatorId: true, coordinatorName: true, merchandiserId: true, merchandiserName: true },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException();
    if (order.deletedAt) throw new NotFoundException('订单不存在');

    const stage = await this.prisma.orderTaStage.findUnique({
      where: { orderId_stageCode: { orderId: BigInt(orderId), stageCode } },
    });
    if (!stage) throw new NotFoundException('T&A阶段不存在');

    // 权限校验
    if (user.role === 'admin') {
      // 全权
    } else if (user.role === 'coordinator') {
      if (!this.isAssignee(order, user)) throw new ForbiddenException('仅能更新自己负责的订单');
    } else if (user.role === 'merchandiser') {
      if (!this.isAssignee(order, user)) throw new ForbiddenException('仅能更新自己负责的订单');
      if (stage.stageCategory === 'shipping') throw new ForbiddenException('跟单员无权更新出货阶段进度');
    } else if (user.role === 'factory') {
      if (stage.stageCategory !== 'production') throw new ForbiddenException('工厂仅能更新大货生产阶段');
    } else {
      throw new ForbiddenException('无更新T&A进度权限');
    }

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
   * 删除订单（软删除）— 仅管理员
   * 置 deletedAt 标记后，列表/详情不再可见；操作日志保留可追溯
   */
  async deleteOrder(orderId: number, user: JwtPayload) {
    if (user.role !== 'admin') throw new ForbiddenException('仅管理员可删除订单');

    const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException();
    if (order.deletedAt) throw new NotFoundException('订单不存在');

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: BigInt(orderId) },
        data: { deletedAt: new Date() },
      });
      await tx.operationLog.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'order',
          action: 'delete',
          changeSummary: `删除订单 ${order.orderNo}（客户: ${order.customerName}，款号: ${order.styleNo}，数量: ${order.totalQty}件）`,
        },
      });
    });

    return { deleted: true };
  }

  /**
   * 设置订单可见性 — 仅管理员
   * visibility: restricted(仅相关人员+显式授权) | company(公司内所有人可见)
   * visibleUserIds: 额外授权的可见用户ID列表
   */
  async updateVisibility(orderId: number, dto: UpdateVisibilityDto, user: JwtPayload) {
    if (user.role !== 'admin') throw new ForbiddenException('仅管理员可设置订单可见性');

    const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException();
    if (order.deletedAt) throw new NotFoundException('订单不存在');

    const updateData: any = {};
    const changes: string[] = [];

    if (dto.visibility && dto.visibility !== order.visibility) {
      updateData.visibility = dto.visibility;
      changes.push(`可见范围: ${order.visibility === 'restricted' ? '仅相关人员' : '公司全员'} → ${dto.visibility === 'restricted' ? '仅相关人员' : '公司全员'}`);
    }
    if (dto.visibleUserIds) {
      const ids = dto.visibleUserIds.map(id => String(id));
      updateData.visibleUserIds = ids;
      const oldIds = (order.visibleUserIds || []).map(id => Number(id));
      const newIds = dto.visibleUserIds;
      const added = newIds.filter(id => !oldIds.includes(id));
      const removed = oldIds.filter(id => !newIds.includes(id));
      if (added.length > 0 || removed.length > 0) {
        changes.push(`额外可见用户: ${added.length > 0 ? '新增' + added.length + '人' : ''}${removed.length > 0 ? '移除' + removed.length + '人' : ''}`);
      }
    }

    if (changes.length === 0) return { updated: false, changes };

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: BigInt(orderId) },
        data: updateData,
      });
      await tx.operationLog.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'order',
          action: 'update',
          changeSummary: `订单可见性调整: ${changes.join('；')}`,
        },
      });
    });

    return { updated: true, changes };
  }

  /**
   * 新增面料记录 — admin / 该订单负责理单
   */
  async addFabric(orderId: number, dto: CreateFabricDto, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException();
    if (order.deletedAt) throw new NotFoundException('订单不存在');

    const canEdit = user.role === 'admin' ||
      (user.role === 'coordinator' && this.isAssignee(order, user));
    if (!canEdit) throw new ForbiddenException('无面料管理权限');

    // 供应商名智能关联：匹配公司内供应商/工厂
    let supplierId: bigint | null = null;
    if (dto.supplierName) {
      const matched = await this.prisma.factory.findFirst({
        where: { companyId: BigInt(user.companyId), factoryName: dto.supplierName },
      });
      if (matched) supplierId = matched.id;
    }

    const fabric = await this.prisma.$transaction(async (tx) => {
      const newFabric = await tx.orderFabric.create({
        data: {
          orderId: BigInt(orderId),
          fabricName: dto.fabricName,
          color: dto.color || null,
          specification: dto.specification || null,
          usagePerPiece: dto.usagePerPiece ?? null,
          totalDemand: dto.totalDemand ?? 0,
          supplierId,
          supplierName: dto.supplierName || null,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : null,
          plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : null,
          notes: dto.notes || null,
          status: dto.orderDate ? 'ordered' : 'not_ordered',
          createdBy: BigInt(user.userId),
        },
      });
      await tx.operationLog.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'fabric',
          action: 'create',
          targetId: newFabric.id,
          changeSummary: `新增面料[${dto.fabricName}]，数量: ${dto.totalDemand ?? '-'}，供应商: ${dto.supplierName || '-'}`,
        },
      });
      return newFabric;
    });

    return { id: Number(fabric.id), fabricName: fabric.fabricName };
  }

  /**
   * 编辑面料记录（品名/颜色/订单数量/供应商/下单日期/计划完成日期）— admin / 该订单负责理单
   */
  async updateFabric(orderId: number, fabricId: number, dto: UpdateFabricDto, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.companyId) !== user.companyId) throw new ForbiddenException();
    if (order.deletedAt) throw new NotFoundException('订单不存在');

    const canEdit = user.role === 'admin' ||
      (user.role === 'coordinator' && this.isAssignee(order, user));
    if (!canEdit) throw new ForbiddenException('无面料管理权限');

    const fabric = await this.prisma.orderFabric.findUnique({
      where: { id: BigInt(fabricId), orderId: BigInt(orderId) },
    });
    if (!fabric) throw new NotFoundException('面料记录不存在');

    const updateData: any = {};
    const changes: string[] = [];

    if (dto.fabricName !== undefined && dto.fabricName !== fabric.fabricName) {
      changes.push(`品名: ${fabric.fabricName} → ${dto.fabricName}`);
      updateData.fabricName = dto.fabricName;
    }
    if (dto.color !== undefined && dto.color !== fabric.color) {
      changes.push(`颜色: ${fabric.color || '-'} → ${dto.color || '-'}`);
      updateData.color = dto.color || null;
    }
    if (dto.totalDemand !== undefined && dto.totalDemand !== fabric.totalDemand) {
      changes.push(`订单数量: ${fabric.totalDemand ?? '-'} → ${dto.totalDemand}`);
      updateData.totalDemand = dto.totalDemand;
    }
    if (dto.supplierName !== undefined && dto.supplierName !== (fabric.supplierName || '')) {
      changes.push(`供应商: ${fabric.supplierName || '-'} → ${dto.supplierName || '-'}`);
      updateData.supplierName = dto.supplierName || null;
      if (dto.supplierName) {
        const matched = await this.prisma.factory.findFirst({
          where: { companyId: BigInt(user.companyId), factoryName: dto.supplierName },
        });
        updateData.supplierId = matched ? matched.id : null;
      } else {
        updateData.supplierId = null;
      }
    }
    if (dto.orderDate !== undefined) {
      const newDate = dto.orderDate ? new Date(dto.orderDate) : null;
      const oldStr = fabric.orderDate ? fabric.orderDate.toISOString().split('T')[0] : '';
      const newStr = dto.orderDate || '';
      if (oldStr !== newStr) {
        changes.push(`下单日期: ${oldStr || '-'} → ${newStr || '-'}`);
        updateData.orderDate = newDate;
      }
    }
    if (dto.plannedDate !== undefined) {
      const newDate = dto.plannedDate ? new Date(dto.plannedDate) : null;
      const oldStr = fabric.plannedDate ? fabric.plannedDate.toISOString().split('T')[0] : '';
      const newStr = dto.plannedDate || '';
      if (oldStr !== newStr) {
        changes.push(`计划完成日期: ${oldStr || '-'} → ${newStr || '-'}`);
        updateData.plannedDate = newDate;
      }
    }
    if (dto.specification !== undefined) updateData.specification = dto.specification || null;
    if (dto.usagePerPiece !== undefined) updateData.usagePerPiece = dto.usagePerPiece ?? null;
    if (dto.notes !== undefined) updateData.notes = dto.notes || null;

    if (changes.length === 0) return { updated: false, changes };

    await this.prisma.$transaction(async (tx) => {
      await tx.orderFabric.update({
        where: { id: BigInt(fabricId) },
        data: updateData,
      });
      await tx.operationLog.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(user.userId),
          userName: user.realName,
          userRole: user.role,
          module: 'fabric',
          action: 'update',
          targetId: BigInt(fabricId),
          changeSummary: `面料[${fabric.fabricName}]更新: ${changes.join('；')}`,
        },
      });
    });

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
      factoryId: order.factoryId ? Number(order.factoryId) : null,
      coordinatorId: order.coordinatorId ? Number(order.coordinatorId) : null,
      coordinatorName: order.coordinatorName,
      merchandiserId: order.merchandiserId ? Number(order.merchandiserId) : null,
      merchandiserName: order.merchandiserName,
      orderStatus: order.orderStatus,
      visibility: order.visibility || 'restricted',
      visibleUserIds: (order.visibleUserIds || []).map((id: any) => Number(id)),
      createdAt: order.createdAt?.toISOString(),
      // 关联对象 — 前端通过 order.customer?.customerName / order.assignedFactory?.factoryName 访问
      customer: order.customer ? {
        id: Number(order.customer.id),
        customerName: order.customer.customerName,
        customerCode: order.customer.customerCode,
      } : null,
      assignedFactory: order.factory ? {
        id: Number(order.factory.id),
        factoryName: order.factory.factoryName,
        factoryCode: order.factory.factoryCode,
      } : null,
    };
  }

  private serializeOrderDetail(order: any) {
    const isCoordRegistered = order.coordinatorId && order.coordinator;
    const isMerRegistered = order.merchandiserId && order.merchandiser;

    // 计算辅料齐套汇总
    const trims = order.trims || [];
    const trimsSummary = {
      ready: trims.filter((t: any) => t.isReady === 1).length,
      total: trims.length,
      allReady: trims.length > 0 && trims.every((t: any) => t.isReady === 1),
    };

    // 计算 T&A 进度汇总
    const taStages = order.taStages || [];
    const taSummary = {
      completed: taStages.filter((s: any) => s.status === 'completed').length,
      total: taStages.length,
      delayed: taStages.filter((s: any) => s.status === 'delayed').length,
    };

    return {
      ...this.serializeOrder(order),
      garmentImageUrl: order.garmentImageUrl,
      remark: order.remark,
      createdBy: order.createdBy ? Number(order.createdBy) : null,
      coordinatorRegistered: !!isCoordRegistered,
      merchandiserRegistered: !!isMerRegistered,
      // 关联用户对象 — 前端通过 order.merchandiser.realName 访问
      merchandiser: order.merchandiser ? {
        id: Number(order.merchandiser.id),
        realName: order.merchandiser.realName,
        username: order.merchandiser.username,
      } : null,
      coordinator: order.coordinator ? {
        id: Number(order.coordinator.id),
        realName: order.coordinator.realName,
        username: order.coordinator.username,
      } : null,
      colorSizes: order.colorSizes?.map(cs => ({
        id: Number(cs.id),
        color: cs.color,
        colorCode: cs.colorCode,
        size: cs.size,
        sizeGroup: cs.sizeGroup,
        quantity: cs.quantity,
        rowColor: cs.rowColor,
        sortOrder: cs.sortOrder,
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
        orderDate: f.orderDate?.toISOString().split('T')[0],
        plannedDate: f.plannedDate?.toISOString().split('T')[0],
        actualDate: f.actualDate?.toISOString().split('T')[0],
        notes: f.notes,
      })) || [],
      trims: trims.map((t: any) => ({
        id: Number(t.id),
        trimName: t.trimName,
        trimCategory: t.trimCategory,
        color: t.color,
        specification: t.specification,
        usagePerPiece: Number(t.usagePerPiece),
        unit: t.unit,
        totalDemand: t.totalDemand,
        supplierName: t.supplierName,
        samplingStatus: t.samplingStatus,
        samplingArrangeDate: t.samplingArrangeDate?.toISOString().split('T')[0],
        samplingCompleteDate: t.samplingCompleteDate?.toISOString().split('T')[0],
        samplingSentDate: t.samplingSentDate?.toISOString().split('T')[0],
        samplingApprovedDate: t.samplingApprovedDate?.toISOString().split('T')[0],
        samplingRemark: t.samplingRemark,
        bulkPoNo: t.bulkPoNo,
        bulkPoStatus: t.bulkPoStatus,
        bulkPoDate: t.bulkPoDate?.toISOString().split('T')[0],
        bulkPlanCompleteDate: t.bulkPlanCompleteDate?.toISOString().split('T')[0],
        bulkActualCompleteDate: t.bulkActualCompleteDate?.toISOString().split('T')[0],
        bulkEtd: t.bulkEtd?.toISOString().split('T')[0],
        bulkEta: t.bulkEta?.toISOString().split('T')[0],
        receivedQty: t.receivedQty,
        qtyCheckStatus: t.qtyCheckStatus,
        qtyCheckDate: t.qtyCheckDate?.toISOString().split('T')[0],
        inspectionResult: t.inspectionResult,
        inspectionNote: t.inspectionNote,
        isReady: t.isReady,
        readyDate: t.readyDate?.toISOString().split('T')[0],
        supplier: t.supplier ? {
          id: Number(t.supplier.id),
          factoryName: t.supplier.factoryName,
        } : null,
      })) || [],
      taStages: taStages.map((s: any) => ({
        id: Number(s.id),
        stageCategory: s.stageCategory,
        stageCode: s.stageCode,
        stageName: s.stageName,
        status: s.status,
        plannedDate: s.plannedDate?.toISOString().split('T')[0],
        startDate: s.startDate?.toISOString().split('T')[0],
        actualDate: s.actualDate?.toISOString().split('T')[0],
        completionPct: s.completionPct,
        remark: s.remark,
        sortOrder: s.sortOrder,
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
      files: order.files?.map(f => ({
        id: Number(f.id),
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileType: f.fileType,
      })) || [],
      trimsSummary,
      taSummary,
    };
  }
}
