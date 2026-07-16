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
exports.CompanyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const company_service_1 = require("./company.service");
const company_dto_1 = require("./dto/company.dto");
let CompanyController = class CompanyController {
    constructor(companyService) {
        this.companyService = companyService;
    }
    async getCompanyInfo(user) {
        return this.companyService.getCompanyInfo(user.companyId);
    }
    async addMember(user, dto) {
        return this.companyService.addMember(user.companyId, user.userId, dto);
    }
    async quickRegister(user, dto) {
        return this.companyService.quickRegister(user.companyId, user.userId, dto);
    }
    async updateMember(user, memberId, dto) {
        return this.companyService.updateMember(user.companyId, user.userId, Number(memberId), dto);
    }
    async deleteMember(user, memberId) {
        return this.companyService.deleteMember(user.companyId, user.userId, Number(memberId));
    }
};
exports.CompanyController = CompanyController;
__decorate([
    (0, common_1.Get)('info'),
    (0, swagger_1.ApiOperation)({ summary: '获取公司信息+团队成员+待注册成员' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "getCompanyInfo", null);
__decorate([
    (0, common_1.Post)('members'),
    (0, swagger_1.ApiOperation)({ summary: '添加团队成员（管理员）' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, company_dto_1.AddMemberDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "addMember", null);
__decorate([
    (0, common_1.Post)('members/quick-register'),
    (0, swagger_1.ApiOperation)({ summary: '快速注册待注册成员（管理员）' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, company_dto_1.QuickRegisterDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "quickRegister", null);
__decorate([
    (0, common_1.Put)('members/:id'),
    (0, swagger_1.ApiOperation)({ summary: '更新成员信息（管理员）' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, company_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    (0, swagger_1.ApiOperation)({ summary: '删除成员（管理员）' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "deleteMember", null);
exports.CompanyController = CompanyController = __decorate([
    (0, swagger_1.ApiTags)('公司/团队 Company'),
    (0, common_1.Controller)('company'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [company_service_1.CompanyService])
], CompanyController);
//# sourceMappingURL=company.controller.js.map