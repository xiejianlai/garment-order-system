import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, WxLoginDto } from './dto/login.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
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
    register(dto: RegisterDto): Promise<{
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
    wxLogin(dto: WxLoginDto): Promise<{
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
    wxBind(user: JwtPayload, dto: WxLoginDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getMe(user: JwtPayload): Promise<{
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
}
