import { PrismaService } from '../prisma/prisma.service';
export declare class LogsController {
    private prisma;
    constructor(prisma: PrismaService);
    getOrderLogs(orderId: number, page?: number, pageSize?: number): Promise<{
        list: {
            id: number;
            orderId: number;
            userId: number;
            targetId: number | null;
            createdAt: Date;
            userName: string;
            userRole: string;
            module: string;
            action: string;
            fieldName: string | null;
            oldValue: string | null;
            newValue: string | null;
            changeSummary: string | null;
            ipAddress: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
