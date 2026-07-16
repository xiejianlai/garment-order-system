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
exports.WebSocketGatewayImpl = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
let WebSocketGatewayImpl = class WebSocketGatewayImpl {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('WebSocket');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
            if (!token) {
                client.disconnect();
                return;
            }
            const cleanToken = token.replace('Bearer ', '');
            const payload = this.jwtService.verify(cleanToken);
            client.userId = payload.userId;
            client.role = payload.role;
            client.realName = payload.realName;
            this.logger.log(`Client connected: ${payload.realName} (${payload.role})`);
        }
        catch (err) {
            this.logger.warn('WebSocket auth failed, disconnecting');
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const name = client.realName || 'Unknown';
        this.logger.log(`Client disconnected: ${name}`);
    }
    handleJoinOrder(data, client) {
        const room = `order:${data.orderId}`;
        client.join(room);
        this.logger.debug(`${client.realName} joined room: ${room}`);
        return { event: 'joined', data: { room } };
    }
    handleLeaveOrder(data, client) {
        const room = `order:${data.orderId}`;
        client.leave(room);
        return { event: 'left', data: { room } };
    }
    emitLogToOrder(orderId, logData) {
        if (!this.server)
            return;
        const room = `order:${orderId}`;
        this.server.to(room).emit('log:new', {
            orderId,
            ...logData,
            timestamp: new Date().toISOString(),
        });
    }
    emitStatusChange(orderId, module, data) {
        if (!this.server)
            return;
        const room = `order:${orderId}`;
        this.server.to(room).emit('status:update', {
            orderId,
            module,
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.WebSocketGatewayImpl = WebSocketGatewayImpl;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebSocketGatewayImpl.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinOrder'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WebSocketGatewayImpl.prototype, "handleJoinOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveOrder'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WebSocketGatewayImpl.prototype, "handleLeaveOrder", null);
exports.WebSocketGatewayImpl = WebSocketGatewayImpl = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/ws',
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], WebSocketGatewayImpl);
//# sourceMappingURL=websocket.gateway.js.map