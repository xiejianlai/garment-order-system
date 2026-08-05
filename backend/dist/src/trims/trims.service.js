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
exports.TrimsService = exports.UpdateTrimStatusDto = exports.CreateTrimDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const class_validator_1 = require("class-validator");
class CreateTrimDto {
}
exports.CreateTrimDto = CreateTrimDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrimDto.prototype, "trimName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrimDto.prototype, "trimCategory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrimDto.prototype, "specification", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTrimDto.prototype, "usagePerPiece", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrimDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTrimDto.prototype, "totalDemand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTrimDto.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrimDto.prototype, "remark", void 0);
class UpdateTrimStatusDto {
}
exports.UpdateTrimStatusDto = UpdateTrimStatusDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "samplingStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "samplingArrangeDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "samplingCompleteDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "samplingSentDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "samplingApprovedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "samplingRemark", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "bulkPoNo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "bulkPoStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "bulkPoDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "bulkPlanCompleteDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "bulkActualCompleteDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "bulkEtd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "bulkEta", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTrimStatusDto.prototype, "receivedQty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "qtyCheckStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "qtyCheckDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "inspectionResult", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTrimStatusDto.prototype, "inspectionNote", void 0);
let TrimsService = class TrimsService {
    constructor(prisma, wsGateway) {
        this.prisma = prisma;
        this.wsGateway = wsGateway;
        this.logger = new common_1.Logger('TrimsService');
    }
    async addTrim(orderId, dto, user) {
        const order = await this.prisma.order.findUnique({
            where: { id: BigInt(orderId) },
            select: { totalQty: true },
        });
        if (!order)
            throw new common_1.NotFoundException('订单不存在');
        const totalDemand = dto.totalDemand && dto.totalDemand > 0
            ? dto.totalDemand
            : Math.ceil(dto.usagePerPiece * order.totalQty);
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
        this.wsGateway.emitLogToOrder(orderId, {
            userName: user.realName,
            userRole: user.role,
            module: 'trim',
            action: 'create',
            changeSummary: `新增辅料[${dto.trimName}]，总需求量: ${totalDemand}`,
        });
        return { id: Number(trim.id), trimName: trim.trimName, totalDemand };
    }
    async updateTrimStatus(trimId, dto, user) {
        const trim = await this.prisma.orderTrim.findUnique({
            where: { id: BigInt(trimId) },
        });
        if (!trim)
            throw new common_1.NotFoundException('辅料记录不存在');
        const updateData = {};
        const changes = [];
        if (dto.samplingStatus && dto.samplingStatus !== trim.samplingStatus) {
            updateData.samplingStatus = dto.samplingStatus;
            changes.push(`打样状态: ${trim.samplingStatus} → ${dto.samplingStatus}`);
        }
        if (dto.samplingArrangeDate)
            updateData.samplingArrangeDate = new Date(dto.samplingArrangeDate);
        if (dto.samplingCompleteDate)
            updateData.samplingCompleteDate = new Date(dto.samplingCompleteDate);
        if (dto.samplingSentDate)
            updateData.samplingSentDate = new Date(dto.samplingSentDate);
        if (dto.samplingApprovedDate)
            updateData.samplingApprovedDate = new Date(dto.samplingApprovedDate);
        if (dto.samplingRemark !== undefined)
            updateData.samplingRemark = dto.samplingRemark;
        if (dto.bulkPoNo !== undefined)
            updateData.bulkPoNo = dto.bulkPoNo;
        if (dto.bulkPoStatus && dto.bulkPoStatus !== trim.bulkPoStatus) {
            updateData.bulkPoStatus = dto.bulkPoStatus;
            changes.push(`大货状态: ${trim.bulkPoStatus} → ${dto.bulkPoStatus}`);
        }
        if (dto.bulkPoDate)
            updateData.bulkPoDate = new Date(dto.bulkPoDate);
        if (dto.bulkPlanCompleteDate)
            updateData.bulkPlanCompleteDate = new Date(dto.bulkPlanCompleteDate);
        if (dto.bulkActualCompleteDate)
            updateData.bulkActualCompleteDate = new Date(dto.bulkActualCompleteDate);
        if (dto.bulkEtd)
            updateData.bulkEtd = new Date(dto.bulkEtd);
        if (dto.bulkEta)
            updateData.bulkEta = new Date(dto.bulkEta);
        if (dto.receivedQty !== undefined)
            updateData.receivedQty = dto.receivedQty;
        if (dto.qtyCheckStatus && dto.qtyCheckStatus !== trim.qtyCheckStatus) {
            updateData.qtyCheckStatus = dto.qtyCheckStatus;
            changes.push(`数量清点: ${trim.qtyCheckStatus} → ${dto.qtyCheckStatus}`);
        }
        if (dto.qtyCheckDate)
            updateData.qtyCheckDate = new Date(dto.qtyCheckDate);
        if (dto.inspectionResult && dto.inspectionResult !== trim.inspectionResult) {
            updateData.inspectionResult = dto.inspectionResult;
            changes.push(`检验结果: ${trim.inspectionResult} → ${dto.inspectionResult}`);
        }
        if (dto.inspectionNote !== undefined)
            updateData.inspectionNote = dto.inspectionNote;
        const newSamplingStatus = updateData.samplingStatus || trim.samplingStatus;
        const newBulkPoStatus = updateData.bulkPoStatus || trim.bulkPoStatus;
        const newQtyCheckStatus = updateData.qtyCheckStatus || trim.qtyCheckStatus;
        const newInspectionResult = updateData.inspectionResult || trim.inspectionResult;
        const isReady = newSamplingStatus === 'approved' &&
            newBulkPoStatus === 'received' &&
            newQtyCheckStatus === 'sufficient' &&
            newInspectionResult === 'pass';
        if (isReady && trim.isReady === 0) {
            updateData.isReady = 1;
            updateData.readyDate = new Date();
            changes.push('辅料已齐套');
        }
        else if (!isReady && trim.isReady === 1) {
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
    async checkTrimsReady(orderId) {
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
    getMissingSteps(trim) {
        const missing = [];
        if (trim.samplingStatus !== 'approved')
            missing.push('打样未确认');
        if (trim.bulkPoStatus !== 'received')
            missing.push('大货未到厂');
        if (trim.qtyCheckStatus !== 'sufficient')
            missing.push('数量未足额');
        if (trim.inspectionResult !== 'pass')
            missing.push('检验未合格');
        return missing;
    }
};
exports.TrimsService = TrimsService;
exports.TrimsService = TrimsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.WebSocketGatewayImpl])
], TrimsService);
//# sourceMappingURL=trims.service.js.map