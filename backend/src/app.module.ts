import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { TrimsModule } from './trims/trims.module';
import { TaStagesModule } from './ta-stages/ta-stages.module';
import { LogsModule } from './logs/logs.module';
import { FilesModule } from './files/files.module';
import { CompanyModule } from './company/company.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ScheduleModule.forRoot(),
    WebSocketModule,
    AuthModule,
    CompanyModule,
    OrdersModule,
    TrimsModule,
    TaStagesModule,
    LogsModule,
    FilesModule,
  ],
})
export class AppModule {}
