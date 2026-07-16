"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const orders_module_1 = require("./orders/orders.module");
const trims_module_1 = require("./trims/trims.module");
const ta_stages_module_1 = require("./ta-stages/ta-stages.module");
const logs_module_1 = require("./logs/logs.module");
const files_module_1 = require("./files/files.module");
const company_module_1 = require("./company/company.module");
const schedule_1 = require("@nestjs/schedule");
const websocket_module_1 = require("./websocket/websocket.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            schedule_1.ScheduleModule.forRoot(),
            websocket_module_1.WebSocketModule,
            auth_module_1.AuthModule,
            company_module_1.CompanyModule,
            orders_module_1.OrdersModule,
            trims_module_1.TrimsModule,
            ta_stages_module_1.TaStagesModule,
            logs_module_1.LogsModule,
            files_module_1.FilesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map