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
exports.QuickRegisterDto = exports.UpdateMemberDto = exports.AddMemberDto = void 0;
const class_validator_1 = require("class-validator");
class AddMemberDto {
}
exports.AddMemberDto = AddMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '姓名不能为空' }),
    __metadata("design:type", String)
], AddMemberDto.prototype, "realName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '登录账号不能为空' }),
    __metadata("design:type", String)
], AddMemberDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '密码不能为空' }),
    (0, class_validator_1.MinLength)(6, { message: '密码至少6位' }),
    __metadata("design:type", String)
], AddMemberDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddMemberDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['admin', 'coordinator', 'merchandiser', 'customer'], { message: '角色必须是 admin/coordinator/merchandiser/customer' }),
    __metadata("design:type", String)
], AddMemberDto.prototype, "role", void 0);
class UpdateMemberDto {
}
exports.UpdateMemberDto = UpdateMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "realName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['admin', 'coordinator', 'merchandiser', 'customer']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['active', 'disabled']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "status", void 0);
class QuickRegisterDto {
}
exports.QuickRegisterDto = QuickRegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "realName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['coordinator', 'merchandiser']),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "role", void 0);
//# sourceMappingURL=company.dto.js.map