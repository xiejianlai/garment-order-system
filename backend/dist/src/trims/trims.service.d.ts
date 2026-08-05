import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { WebSocketGatewayImpl } from '../websocket/websocket.gateway';
export declare class CreateTrimDto {
    trimName: string;
    trimCategory: string;
    specification?: string;
    usagePerPiece: number;
    unit?: string;
    totalDemand?: number;
    supplierId?: number;
    remark?: string;
}
export declare class UpdateTrimStatusDto {
    samplingStatus?: string;
    samplingArrangeDate?: string;
    samplingCompleteDate?: string;
    samplingSentDate?: string;
    samplingApprovedDate?: string;
    samplingRemark?: string;
    bulkPoNo?: string;
    bulkPoStatus?: string;
    bulkPoDate?: string;
    bulkPlanCompleteDate?: string;
    bulkActualCompleteDate?: string;
    bulkEtd?: string;
    bulkEta?: string;
    receivedQty?: number;
    qtyCheckStatus?: string;
    qtyCheckDate?: string;
    inspectionResult?: string;
    inspectionNote?: string;
}
export declare class TrimsService {
    private prisma;
    private wsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, wsGateway: WebSocketGatewayImpl);
    addTrim(orderId: number, dto: CreateTrimDto, user: JwtPayload): Promise<{
        id: number;
        trimName: string;
        totalDemand: number;
    }>;
    updateTrimStatus(trimId: number, dto: UpdateTrimStatusDto, user: JwtPayload): Promise<{
        id: number;
        isReady: boolean;
        changes: string[];
    }>;
    checkTrimsReady(orderId: number): Promise<{
        allReady: boolean;
        readyCount: number;
        totalCount: number;
        notReadyItems: {
            id: number;
            trimName: string;
            missingSteps: string[];
        }[];
    }>;
    private getMissingSteps;
}
