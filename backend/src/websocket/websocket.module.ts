import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebSocketGatewayImpl } from './websocket.gateway';

/**
 * WebSocket 全局模块
 *
 * 全局模块 — 其他模块无需 import 即可注入 WebSocketGatewayImpl
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'garment-order-secret-key-2026',
    }),
  ],
  providers: [WebSocketGatewayImpl],
  exports: [WebSocketGatewayImpl],
})
export class WebSocketModule {}
