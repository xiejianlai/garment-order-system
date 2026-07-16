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
    }>;
}
