import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CompanyService } from './company.service';
import { AddMemberDto, UpdateMemberDto, QuickRegisterDto, ExtendTrialDto } from './dto/company.dto';
export declare class CompanyController {
    private companyService;
    constructor(companyService: CompanyService);
    getCompanyInfo(user: JwtPayload): Promise<{
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
    addMember(user: JwtPayload, dto: AddMemberDto): Promise<{
        id: number;
        username: string;
        realName: string;
        role: string;
        teamId: number | null;
        syncedOrders: boolean;
    }>;
    quickRegister(user: JwtPayload, dto: QuickRegisterDto): Promise<{
        id: number;
        realName: string;
        role: string;
        teamId: number | null;
        syncedOrders: boolean;
    }>;
    updateMember(user: JwtPayload, memberId: string, dto: UpdateMemberDto): Promise<{
        id: number;
        realName: string;
        role: string;
    }>;
    deleteMember(user: JwtPayload, memberId: string): Promise<{
        deleted: boolean;
        realName: string;
    }>;
    extendTrial(user: JwtPayload, dto: ExtendTrialDto): Promise<{
        plan: string;
        trialEndsAt: string;
        daysLeft: number;
        message: string;
    }>;
    activate(user: JwtPayload): Promise<{
        plan: string;
        message: string;
    }>;
}
