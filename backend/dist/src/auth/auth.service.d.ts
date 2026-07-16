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
    }>;
    private code2Session;
    private buildPayload;
}
