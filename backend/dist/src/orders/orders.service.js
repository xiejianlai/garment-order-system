"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
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
let OrdersService = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('OrdersService');
    }
    async createOrder(dto, user) {
        const totalQty = dto.colorSizes.reduce((sum, item) => sum + item.quantity, 0);
        const companyId = BigInt(user.companyId);
        let coordinatorId = dto.coordinatorId ? BigInt(dto.coordinatorId) : null;
        let merchandiserId = dto.merchandiserId ? BigInt(dto.merchandiserId) : null;
        if (!coordinatorId && dto.coordinatorName) {
            const matched = await this.prisma.sysUser.findFirst({
                where: { companyId, realName: dto.coordinatorName, role: 'coordinator', status: 1 },
            });
            if (matched)
                coordinatorId = matched.id;
        }
        if (!merchandiserId && dto.merchandiserName) {
            const matched = await this.prisma.sysUser.findFirst({
                where: { companyId, realName: dto.merchandiserName, role: 'merchandiser', status: 1 },
            });
            if (matched)
                merchandiserId = matched.id;
        }
        if (user.role === 'coordinator') {
            coordinatorId = BigInt(user.userId);
            if (!dto.coordinatorName)
                dto.coordinatorName = user.realName;
        }
        let customerId = BigInt(1);
        const customerName = dto.customerName.trim();
        if (customerName) {
            const existingCustomer = await this.prisma.customer.findFirst({
                where: { companyId, customerName },
            });
            if (existingCustomer) {
                customerId = existingCustomer.id;
            }
            else {
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
                    factoryId: null,
                    coordinatorId,
                    coordinatorName: dto.coordinatorName || '未分配',
                    merchandiserId,
                    merchandiserName: dto.merchandiserName || '未分配',
                    orderStatus: 'draft',
                    createdBy: BigInt(user.userId),
                },
            });
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
            await tx.orderTaStage.createMany({
                data: TA_STAGE_TEMPLATES.map((tpl) => ({
                    orderId: newOrder.id,
                    stageCategory: tpl.stageCategory,
                    stageCode: tpl.stageCode,
                    stageName: tpl.stageName,
                    sortOrder: tpl.sortOrder,
                })),
            });
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
    async getOrderList(user, status, page, limit) {
        const companyId = BigInt(user.companyId);
        const where = { companyId, deletedAt: null };
        if (user.role === 'coordinator') {
            where.OR = [
                { coordinatorId: BigInt(user.userId) },
                { coordinatorName: user.realName, coordinatorId: null },
                { visibleUserIds: { has: String(user.userId) } },
            ];
        }
        else if (user.role === 'merchandiser') {
            where.OR = [
                { merchandiserId: BigInt(user.userId) },
                { merchandiserName: user.realName, merchandiserId: null },
                { visibleUserIds: { has: String(user.userId) } },
            ];
        }
        else if (user.role === 'customer') {
            where.customerId = BigInt(user.customerId || 0);
        }
        if (status)
            where.orderStatus = status;
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
    async getOrderDetail(orderId, user) {
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
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException('无权查看此订单');
        if (order.deletedAt)
            throw new common_1.NotFoundException('订单不存在');
        if (!this.canViewOrder(order, user)) {
            throw new common_1.ForbiddenException('无权查看此订单');
        }
        return this.serializeOrderDetail(order);
    }
    canViewOrder(order, user) {
        if (user.role === 'admin')
            return true;
        if (user.role === 'customer') {
            return Number(order.customerId) === Number(user.customerId || 0);
        }
        const viewerIds = (order.visibleUserIds || []).map((id) => Number(id));
        if (viewerIds.includes(Number(user.userId)))
            return true;
        if (user.role === 'coordinator') {
            return Number(order.coordinatorId) === Number(user.userId) ||
                (order.coordinatorName === user.realName && !order.coordinatorId);
        }
        if (user.role === 'merchandiser') {
            return Number(order.merchandiserId) === Number(user.userId) ||
                (order.merchandiserName === user.realName && !order.merchandiserId);
        }
        return true;
    }
    isAssignee(order, user) {
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
    async updateOrder(orderId, dto, user) {
        const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException();
        const canEdit = user.role === 'admin' ||
            (user.role === 'coordinator' && (Number(order.coordinatorId) === user.userId || order.coordinatorName === user.realName));
        if (!canEdit)
            throw new common_1.ForbiddenException('无编辑权限');
        const changes = [];
        let coordinatorId = dto.coordinatorId ? BigInt(dto.coordinatorId) : order.coordinatorId;
        let merchandiserId = dto.merchandiserId ? BigInt(dto.merchandiserId) : order.merchandiserId;
        let coordinatorName = dto.coordinatorName || order.coordinatorName;
        let merchandiserName = dto.merchandiserName || order.merchandiserName;
        if (dto.coordinatorName && !dto.coordinatorId) {
            const matched = await this.prisma.sysUser.findFirst({
                where: { companyId: BigInt(user.companyId), realName: dto.coordinatorName, role: 'coordinator' },
            });
            if (matched)
                coordinatorId = matched.id;
            else
                coordinatorId = null;
        }
        if (dto.merchandiserName && !dto.merchandiserId) {
            const matched = await this.prisma.sysUser.findFirst({
                where: { companyId: BigInt(user.companyId), realName: dto.merchandiserName, role: 'merchandiser' },
            });
            if (matched)
                merchandiserId = matched.id;
            else
                merchandiserId = null;
        }
        if (order.orderNo !== dto.orderNo && dto.orderNo)
            changes.push(`订单号: ${order.orderNo} → ${dto.orderNo}`);
        if (order.styleNo !== dto.styleNo && dto.styleNo)
            changes.push(`款号: ${order.styleNo} → ${dto.styleNo}`);
        if (order.coordinatorName !== coordinatorName)
            changes.push(`理单: ${order.coordinatorName || '未分配'} → ${coordinatorName}`);
        if (order.merchandiserName !== merchandiserName)
            changes.push(`跟单: ${order.merchandiserName || '未分配'} → ${merchandiserName}`);
        const updateData = {};
        if (dto.orderNo)
            updateData.orderNo = dto.orderNo;
        if (dto.styleNo)
            updateData.styleNo = dto.styleNo;
        if (dto.styleName)
            updateData.styleName = dto.styleName;
        if (dto.season)
            updateData.season = dto.season;
        if (dto.category)
            updateData.category = dto.category;
        if (dto.garmentImageUrl)
            updateData.garmentImageUrl = dto.garmentImageUrl;
        if (dto.customerName)
            updateData.customerName = dto.customerName;
        if (dto.factoryName)
            updateData.factoryName = dto.factoryName;
        if (dto.deliveryDate)
            updateData.deliveryDate = new Date(dto.deliveryDate);
        updateData.coordinatorId = coordinatorId;
        updateData.coordinatorName = coordinatorName;
        updateData.merchandiserId = merchandiserId;
        updateData.merchandiserName = merchandiserName;
        let newTotalQty = order.totalQty;
        if (dto.colorSizes && dto.colorSizes.length > 0) {
            newTotalQty = dto.colorSizes.reduce((sum, item) => sum + item.quantity, 0);
            updateData.totalQty = newTotalQty;
            if (order.totalQty !== newTotalQty)
                changes.push(`总数量: ${order.totalQty.toLocaleString()} → ${newTotalQty.toLocaleString()}`);
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
    async updateOrderStatus(orderId, dto, user) {
        const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException();
        if (order.deletedAt)
            throw new common_1.NotFoundException('订单不存在');
        const canChange = user.role === 'admin' ||
            (user.role === 'coordinator' && this.isAssignee(order, user));
        if (!canChange)
            throw new common_1.ForbiddenException('无修改订单状态权限');
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
    async updateTaStage(orderId, stageCode, dto, user) {
        const order = await this.prisma.order.findUnique({
            where: { id: BigInt(orderId) },
            select: { id: true, companyId: true, deletedAt: true, coordinatorId: true, coordinatorName: true, merchandiserId: true, merchandiserName: true },
        });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException();
        if (order.deletedAt)
            throw new common_1.NotFoundException('订单不存在');
        const stage = await this.prisma.orderTaStage.findUnique({
            where: { orderId_stageCode: { orderId: BigInt(orderId), stageCode } },
        });
        if (!stage)
            throw new common_1.NotFoundException('T&A阶段不存在');
        if (user.role === 'admin') {
        }
        else if (user.role === 'coordinator') {
            if (!this.isAssignee(order, user))
                throw new common_1.ForbiddenException('仅能更新自己负责的订单');
        }
        else if (user.role === 'merchandiser') {
            if (!this.isAssignee(order, user))
                throw new common_1.ForbiddenException('仅能更新自己负责的订单');
            if (stage.stageCategory === 'shipping')
                throw new common_1.ForbiddenException('跟单员无权更新出货阶段进度');
        }
        else if (user.role === 'factory') {
            if (stage.stageCategory !== 'production')
                throw new common_1.ForbiddenException('工厂仅能更新大货生产阶段');
        }
        else {
            throw new common_1.ForbiddenException('无更新T&A进度权限');
        }
        const changes = [];
        const updateData = { updatedBy: BigInt(user.userId) };
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
    async deleteOrder(orderId, user) {
        if (user.role !== 'admin')
            throw new common_1.ForbiddenException('仅管理员可删除订单');
        const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException();
        if (order.deletedAt)
            throw new common_1.NotFoundException('订单不存在');
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
    async updateVisibility(orderId, dto, user) {
        if (user.role !== 'admin')
            throw new common_1.ForbiddenException('仅管理员可设置订单可见性');
        const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException();
        if (order.deletedAt)
            throw new common_1.NotFoundException('订单不存在');
        const updateData = {};
        const changes = [];
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
        if (changes.length === 0)
            return { updated: false, changes };
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
    async addFabric(orderId, dto, user) {
        const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException();
        if (order.deletedAt)
            throw new common_1.NotFoundException('订单不存在');
        const canEdit = user.role === 'admin' ||
            (user.role === 'coordinator' && this.isAssignee(order, user));
        if (!canEdit)
            throw new common_1.ForbiddenException('无面料管理权限');
        let supplierId = null;
        if (dto.supplierName) {
            const matched = await this.prisma.factory.findFirst({
                where: { companyId: BigInt(user.companyId), factoryName: dto.supplierName },
            });
            if (matched)
                supplierId = matched.id;
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
    async updateFabric(orderId, fabricId, dto, user) {
        const order = await this.prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        if (Number(order.companyId) !== user.companyId)
            throw new common_1.ForbiddenException();
        if (order.deletedAt)
            throw new common_1.NotFoundException('订单不存在');
        const canEdit = user.role === 'admin' ||
            (user.role === 'coordinator' && this.isAssignee(order, user));
        if (!canEdit)
            throw new common_1.ForbiddenException('无面料管理权限');
        const fabric = await this.prisma.orderFabric.findUnique({
            where: { id: BigInt(fabricId), orderId: BigInt(orderId) },
        });
        if (!fabric)
            throw new common_1.NotFoundException('面料记录不存在');
        const updateData = {};
        const changes = [];
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
            }
            else {
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
        if (dto.specification !== undefined)
            updateData.specification = dto.specification || null;
        if (dto.usagePerPiece !== undefined)
            updateData.usagePerPiece = dto.usagePerPiece ?? null;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes || null;
        if (changes.length === 0)
            return { updated: false, changes };
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
    async getOptions(user) {
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
    serializeOrder(order) {
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
            visibleUserIds: (order.visibleUserIds || []).map((id) => Number(id)),
            createdAt: order.createdAt?.toISOString(),
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
    serializeOrderDetail(order) {
        const isCoordRegistered = order.coordinatorId && order.coordinator;
        const isMerRegistered = order.merchandiserId && order.merchandiser;
        const trims = order.trims || [];
        const trimsSummary = {
            ready: trims.filter((t) => t.isReady === 1).length,
            total: trims.length,
            allReady: trims.length > 0 && trims.every((t) => t.isReady === 1),
        };
        const taStages = order.taStages || [];
        const taSummary = {
            completed: taStages.filter((s) => s.status === 'completed').length,
            total: taStages.length,
            delayed: taStages.filter((s) => s.status === 'delayed').length,
        };
        return {
            ...this.serializeOrder(order),
            garmentImageUrl: order.garmentImageUrl,
            remark: order.remark,
            createdBy: order.createdBy ? Number(order.createdBy) : null,
            coordinatorRegistered: !!isCoordRegistered,
            merchandiserRegistered: !!isMerRegistered,
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
            trims: trims.map((t) => ({
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
            taStages: taStages.map((s) => ({
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map