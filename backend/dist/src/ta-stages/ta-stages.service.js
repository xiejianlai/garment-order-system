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
exports.TaStagesService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const common_2 = require("@nestjs/common");
let TaStagesService = class TaStagesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_2.Logger('TaStagesService');
    }
    async checkDelayedStages() {
        const now = new Date();
        const result = await this.prisma.orderTaStage.updateMany({
            where: {
                plannedDate: { lt: now },
                status: { not: 'completed' },
            },
            data: { status: 'delayed' },
        });
        if (result.count > 0) {
            this.logger.log(`T&A 延误检查: ${result.count} 个阶段被标记为延误`);
        }
    }
};
exports.TaStagesService = TaStagesService;
__decorate([
    (0, schedule_1.Cron)('0 1 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaStagesService.prototype, "checkDelayedStages", null);
exports.TaStagesService = TaStagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaStagesService);
//# sourceMappingURL=ta-stages.service.js.map