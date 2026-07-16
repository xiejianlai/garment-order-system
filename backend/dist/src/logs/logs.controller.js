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
exports.LogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let LogsController = class LogsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrderLogs(orderId, page = 1, pageSize = 50) {
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
};
exports.LogsController = LogsController;
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, swagger_1.ApiOperation)({ summary: '获取订单操作日志流' }),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "getOrderLogs", null);
exports.LogsController = LogsController = __decorate([
    (0, swagger_1.ApiTags)('操作日志 Logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('logs'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LogsController);
//# sourceMappingURL=logs.controller.js.map