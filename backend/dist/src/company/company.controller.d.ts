import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CompanyService } from './company.service';
import { AddMemberDto, UpdateMemberDto, QuickRegisterDto } from './dto/company.dto';
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
    addMember(user: JwtPayload, dto: AddMemberDto): Promise<{
        id: number;
        username: string;
        realName: string;
        role: string;
        syncedOrders: boolean;
    }>;
    quickRegister(user: JwtPayload, dto: QuickRegisterDto): Promise<{
        id: number;
        realName: string;
        role: string;
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
}
