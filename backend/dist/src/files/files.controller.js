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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const class_validator_1 = require("class-validator");
class UploadFileDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '文件类型' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadFileDto.prototype, "fileType", void 0);
let FilesController = class FilesController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadFile(orderId, file, dto, user) {
        if (!file) {
            throw new Error('文件不能为空');
        }
        const fileUrl = `/uploads/${Date.now()}-${file.originalname}`;
        const record = await this.prisma.orderFile.create({
            data: {
                orderId: BigInt(orderId),
                fileName: file.originalname,
                fileUrl,
                fileType: dto.fileType,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedBy: BigInt(user.userId),
            },
        });
        await this.prisma.operationLog.create({
            data: {
                orderId: BigInt(orderId),
                userId: BigInt(user.userId),
                userName: user.realName,
                userRole: user.role,
                module: 'file',
                action: 'create',
                targetId: record.id,
                changeSummary: `上传文件[${file.originalname}]（类型: ${dto.fileType}）`,
            },
        });
        return {
            id: Number(record.id),
            fileName: record.fileName,
            fileUrl: record.fileUrl,
            fileType: record.fileType,
        };
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)(':orderId/upload'),
    (0, roles_decorator_1.Roles)('admin', 'merchandiser'),
    (0, swagger_1.ApiOperation)({ summary: '上传订单文件（小程序/H5统一接口）' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, UploadFileDto, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadFile", null);
exports.FilesController = FilesController = __decorate([
    (0, swagger_1.ApiTags)('文件 Files'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FilesController);
//# sourceMappingURL=files.controller.js.map