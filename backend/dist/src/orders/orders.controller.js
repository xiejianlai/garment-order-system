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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async create(dto, user) {
        return this.ordersService.createOrder(dto, user);
    }
    async findAll(user, page, limit, status) {
        return this.ordersService.getOrderList(user, status, page || 1, limit || 20);
    }
    async getOptions(user) {
        return this.ordersService.getOptions(user);
    }
    async findOne(id, user) {
        return this.ordersService.getOrderDetail(Number(id), user);
    }
    async update(id, dto, user) {
        return this.ordersService.updateOrder(Number(id), dto, user);
    }
    async updateStatus(id, dto, user) {
        return this.ordersService.updateOrderStatus(Number(id), dto, user);
    }
    async updateTaStage(id, stageCode, dto, user) {
        return this.ordersService.updateTaStage(Number(id), stageCode, dto, user);
    }
    async remove(id, user) {
        return this.ordersService.deleteOrder(Number(id), user);
    }
    async updateVisibility(id, dto, user) {
        return this.ordersService.updateVisibility(Number(id), dto, user);
    }
    async addFabric(id, dto, user) {
        return this.ordersService.addFabric(Number(id), dto, user);
    }
    async updateFabric(id, fabricId, dto, user) {
        return this.ordersService.updateFabric(Number(id), Number(fabricId), dto, user);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建订单（自由输入理单/跟单名字）' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取订单列表（角色过滤 + 公司数据隔离）' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('options'),
    (0, swagger_1.ApiOperation)({ summary: '获取下拉选项（客户、工厂、理单、跟单）' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取订单详情（含矩阵、面料、辅料、T&A、日志）' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '编辑订单（基础信息+重新分配理单/跟单）' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.UpdateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新订单状态' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.UpdateOrderStatusDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/ta-stages/:stageCode'),
    (0, swagger_1.ApiOperation)({ summary: '更新T&A阶段（状态+三日期+进度）' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('stageCode')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_order_dto_1.UpdateTaStageDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateTaStage", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除订单（仅管理员，软删除+记录日志）' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/visibility'),
    (0, swagger_1.ApiOperation)({ summary: '设置订单可见性（仅管理员）' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.UpdateVisibilityDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateVisibility", null);
__decorate([
    (0, common_1.Post)(':id/fabrics'),
    (0, swagger_1.ApiOperation)({ summary: '新增面料记录（品名/颜色/数量/供应商/下单日期/计划完成日期）' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.CreateFabricDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "addFabric", null);
__decorate([
    (0, common_1.Patch)(':id/fabrics/:fabricId'),
    (0, swagger_1.ApiOperation)({ summary: '编辑面料记录' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fabricId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_order_dto_1.UpdateFabricDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateFabric", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('订单 Orders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map