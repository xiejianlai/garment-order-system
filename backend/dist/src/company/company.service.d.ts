import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto, UpdateMemberDto, QuickRegisterDto } from './dto/company.dto';
export declare class CompanyService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCompanyInfo(companyId: number): Promise<{
        id: number;
        code: string;
        name: string;
        createdAt: string;
        userCount: number;
        orderCount: number;
        trial: {
            plan: string;
            trialStartedAt: string | null;
            trialEndsAt: string | null;
            daysLeft: number;
        };
        users: {
            id: number;
            username: string;
            realName: string;
            role: string;
            phone: string | null;
            avatarColor: string | null;
            status: string;
            lastLoginAt: string | null;
            teamId: number | null;
            teamName: string | null;
            orderCount: number | null;
        }[];
        teams: {
            id: number;
            name: string;
            remark: string | null;
            status: string;
            memberCount: number;
            createdAt: string;
        }[];
        unregistered: {
            name: string;
            role: string;
            orders: string[];
        }[];
    }>;
    addMember(companyId: number, adminId: number, dto: AddMemberDto): Promise<{
        id: number;
        username: string;
        realName: string;
        role: string;
        syncedOrders: boolean;
    }>;
    quickRegister(companyId: number, adminId: number, dto: QuickRegisterDto): Promise<{
        id: number;
        realName: string;
        role: string;
        syncedOrders: boolean;
    }>;
    updateMember(companyId: number, adminId: number, memberId: number, dto: UpdateMemberDto): Promise<{
        id: number;
        realName: string;
        role: string;
    }>;
    deleteMember(companyId: number, adminId: number, memberId: number): Promise<{
        deleted: boolean;
        realName: string;
    }>;
    extendTrial(companyId: number, adminId: number, days: number): Promise<{
        plan: string;
        trialEndsAt: string;
        daysLeft: number;
        message: string;
    }>;
    activateCompany(companyId: number, adminId: number): Promise<{
        plan: string;
        message: string;
    }>;
    private resolveTeamId;
    private assertTeamInCompany;
    private calcTrialDaysLeft;
    private syncMemberToOrders;
}
