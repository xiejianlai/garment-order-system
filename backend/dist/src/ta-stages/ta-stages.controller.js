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
exports.TaStagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ta_stages_service_1 = require("./ta-stages.service");
let TaStagesController = class TaStagesController {
    constructor(taStagesService) {
        this.taStagesService = taStagesService;
    }
    health() {
        return { status: 'ok' };
    }
};
exports.TaStagesController = TaStagesController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaStagesController.prototype, "health", null);
exports.TaStagesController = TaStagesController = __decorate([
    (0, swagger_1.ApiTags)('T&A 进度'),
    (0, common_1.Controller)('ta-stages'),
    __metadata("design:paramtypes", [ta_stages_service_1.TaStagesService])
], TaStagesController);
//# sourceMappingURL=ta-stages.controller.js.map