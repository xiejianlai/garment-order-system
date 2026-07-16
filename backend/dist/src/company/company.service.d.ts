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
        users: {
            id: number;
            username: string;
            realName: string;
            role: string;
            phone: string | null;
            avatarColor: string | null;
            status: string;
            lastLoginAt: string | null;
            orderCount: number | null;
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
    private syncMemberToOrders;
}
