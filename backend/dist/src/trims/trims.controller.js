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
exports.TrimsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const trims_service_1 = require("./trims.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TrimsController = class TrimsController {
    constructor(trimsService) {
        this.trimsService = trimsService;
    }
    async addTrim(orderId, dto, user) {
        return this.trimsService.addTrim(orderId, dto, user);
    }
    async updateStatus(trimId, dto, user) {
        return this.trimsService.updateTrimStatus(trimId, dto, user);
    }
    async checkReady(orderId) {
        return this.trimsService.checkTrimsReady(orderId);
    }
};
exports.TrimsController = TrimsController;
__decorate([
    (0, common_1.Post)(':orderId'),
    (0, roles_decorator_1.Roles)('admin', 'merchandiser'),
    (0, swagger_1.ApiOperation)({ summary: '为订单添加辅料' }),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, trims_service_1.CreateTrimDto, Object]),
    __metadata("design:returntype", Promise)
], TrimsController.prototype, "addTrim", null);
__decorate([
    (0, common_1.Patch)(':trimId/status'),
    (0, roles_decorator_1.Roles)('admin', 'merchandiser'),
    (0, swagger_1.ApiOperation)({ summary: '更新辅料进度（自动判定齐套）' }),
    __param(0, (0, common_1.Param)('trimId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, trims_service_1.UpdateTrimStatusDto, Object]),
    __metadata("design:returntype", Promise)
], TrimsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('check/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: '一键查看辅料齐套状态' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TrimsController.prototype, "checkReady", null);
exports.TrimsController = TrimsController = __decorate([
    (0, swagger_1.ApiTags)('辅料 Trims'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('trims'),
    __metadata("design:paramtypes", [trims_service_1.TrimsService])
], TrimsController);
//# sourceMappingURL=trims.controller.js.map