import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class WebSocketGatewayImpl implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private readonly logger;
    server: Server;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinOrder(data: {
        orderId: number;
    }, client: Socket): {
        event: string;
        data: {
            room: string;
        };
    };
    handleLeaveOrder(data: {
        orderId: number;
    }, client: Socket): {
        event: string;
        data: {
            room: string;
        };
    };
    emitLogToOrder(orderId: number, logData: any): void;
    emitStatusChange(orderId: number, module: string, data: any): void;
}
