import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, WxLoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    loginWithPassword(dto: LoginDto): Promise<{
        token: string;
        user: {
            id: number;
            companyId: number;
            companyCode: string;
            companyName: string;
            username: string;
            realName: string;
            role: string;
            avatarColor: string | null;
            customerId: number | null;
        };
        trial: {
            plan: any;
            trialStartedAt: any;
            trialEndsAt: any;
            daysLeft: number;
            isActive: boolean;
            isTrial: boolean;
            isExpired: boolean;
        };
    }>;
    registerCompany(dto: RegisterDto): Promise<{
        token: string;
        company: {
            id: number;
            code: string;
            name: string;
        };
        user: {
            id: number;
            companyId: number;
            companyCode: string;
            companyName: string;
            username: string;
            realName: string;
            role: string;
            avatarColor: string | null;
        };
        trial: {
            plan: any;
            trialStartedAt: any;
            trialEndsAt: any;
            daysLeft: number;
            isActive: boolean;
            isTrial: boolean;
            isExpired: boolean;
        };
    }>;
    loginWithWechat(dto: WxLoginDto): Promise<{
        token: string;
        user: {
            id: number;
            companyId: number;
            companyCode: string;
            companyName: string;
            username: string;
            realName: string;
            role: string;
            avatarColor: string | null;
            customerId: number | null;
        };
        trial: {
            plan: any;
            trialStartedAt: any;
            trialEndsAt: any;
            daysLeft: number;
            isActive: boolean;
            isTrial: boolean;
            isExpired: boolean;
        };
    }>;
    bindWechat(userId: number, code: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCurrentUser(userId: number, companyId: number): Promise<{
        id: number;
        companyId: number;
        companyCode: string;
        companyName: string;
        username: string;
        realName: string;
        role: string;
        phone: string | null;
        avatarColor: string | null;
        customerId: number | null;
        teamId: number | null;
        teamName: string | null;
        trial: {
            plan: any;
            trialStartedAt: any;
            trialEndsAt: any;
            daysLeft: number;
            isActive: boolean;
            isTrial: boolean;
            isExpired: boolean;
        };
    }>;
    private code2Session;
    private checkTrial;
    private buildTrialInfo;
    private buildPayload;
}
