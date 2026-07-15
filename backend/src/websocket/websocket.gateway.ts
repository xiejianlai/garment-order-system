import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket 网关 — 实时操作日志推送
 *
 * 设计:
 * 1. 客户端连接时通过 token 认证
 * 2. 客户端通过 joinOrder 加入订单房间
 * 3. 服务端通过 emitToOrder 推送日志到所有在订单房间的客户端
 * 4. 小程序使用 uni.connectSocket, H5 使用原生 WebSocket 或 socket.io-client
 *
 * 跨端兼容:
 * - 小程序: uni.connectSocket 连接 ws:// 或 wss://
 * - H5: socket.io-client 连载
 * - 本网关使用 socket.io 协议, 小程序需用 socket.io 的 polling 模式
 */
@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: true, // 生产环境应配置具体域名
    credentials: true,
  },
  transports: ['websocket', 'polling'], // 兼容小程序
})
export class WebSocketGatewayImpl implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('WebSocket');

  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  /**
   * 客户端连接 — 验证 JWT
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
      if (!token) {
        client.disconnect();
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken);
      (client as any).userId = payload.userId;
      (client as any).role = payload.role;
      (client as any).realName = payload.realName;

      this.logger.log(`Client connected: ${payload.realName} (${payload.role})`);
    } catch (err) {
      this.logger.warn('WebSocket auth failed, disconnecting');
      client.disconnect();
    }
  }

  /**
   * 客户端断开
   */
  handleDisconnect(client: Socket) {
    const name = (client as any).realName || 'Unknown';
    this.logger.log(`Client disconnected: ${name}`);
  }

  /**
   * 客户端加入订单房间 — 订阅该订单的实时日志
   */
  @SubscribeMessage('joinOrder')
  handleJoinOrder(
    @MessageBody() data: { orderId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `order:${data.orderId}`;
    client.join(room);
    this.logger.debug(`${(client as any).realName} joined room: ${room}`);
    return { event: 'joined', data: { room } };
  }

  /**
   * 客户端离开订单房间
   */
  @SubscribeMessage('leaveOrder')
  handleLeaveOrder(
    @MessageBody() data: { orderId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `order:${data.orderId}`;
    client.leave(room);
    return { event: 'left', data: { room } };
  }

  /**
   * 推送操作日志到订单房间 — 供其他 Service 调用
   */
  emitLogToOrder(orderId: number, logData: any) {
    if (!this.server) return;
    const room = `order:${orderId}`;
    this.server.to(room).emit('log:new', {
      orderId,
      ...logData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 推送状态变更通知
   */
  emitStatusChange(orderId: number, module: string, data: any) {
    if (!this.server) return;
    const room = `order:${orderId}`;
    this.server.to(room).emit('status:update', {
      orderId,
      module,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
