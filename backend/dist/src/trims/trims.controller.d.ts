import { TrimsService, CreateTrimDto, UpdateTrimStatusDto } from './trims.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class TrimsController {
    private trimsService;
    constructor(trimsService: TrimsService);
    addTrim(orderId: number, dto: CreateTrimDto, user: JwtPayload): Promise<{
        id: number;
        trimName: string;
        totalDemand: number;
    }>;
    updateStatus(trimId: number, dto: UpdateTrimStatusDto, user: JwtPayload): Promise<{
        id: number;
        isReady: boolean;
        changes: string[];
    }>;
    checkReady(orderId: number): Promise<{
        allReady: boolean;
        readyCount: number;
        totalCount: number;
        notReadyItems: {
            id: number;
            trimName: string;
            missingSteps: string[];
        }[];
    }>;
}
