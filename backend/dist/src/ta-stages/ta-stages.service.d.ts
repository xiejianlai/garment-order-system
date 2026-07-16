import { PrismaService } from '../prisma/prisma.service';
export declare class TaStagesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkDelayedStages(): Promise<void>;
}
