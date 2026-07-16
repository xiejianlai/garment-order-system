"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('AuthService');
    }
    async loginWithPassword(dto) {
        const company = await this.prisma.company.findUnique({
            where: { code: dto.companyCode },
        });
        if (!company) {
            throw new common_1.UnauthorizedException('公司代码不存在');
        }
        if (company.status !== 1) {
            throw new common_1.UnauthorizedException('该公司已被禁用');
        }
        const user = await this.prisma.sysUser.findUnique({
            where: {
                companyId_username: {
                    companyId: company.id,
                    username: dto.username,
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        if (user.status !== 1) {
            throw new common_1.UnauthorizedException('账号已被禁用，请联系管理员');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        await this.prisma.sysUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const payload = this.buildPayload(user, company, 'h5');
        const token = this.jwtService.sign(payload);
        this.logger.log(`H5 登录成功: ${company.code}/${user.username} (${user.realName})`);
        return {
            token,
            user: {
                id: Number(user.id),
                companyId: Number(company.id),
                companyCode: company.code,
                companyName: company.name,
                username: user.username,
                realName: user.realName,
                role: user.role,
                avatarColor: user.avatarColor,
                customerId: user.customerId ? Number(user.customerId) : null,
            },
        };
    }
    async registerCompany(dto) {
        const existingCompany = await this.prisma.company.findUnique({
            where: { code: dto.companyCode },
        });
        if (existingCompany) {
            throw new common_1.BadRequestException('公司代码已被注册');
        }
        const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
        const avatarColors = ['#1677ff', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96'];
        const result = await this.prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    code: dto.companyCode,
                    name: dto.companyName,
                },
            });
            const admin = await tx.sysUser.create({
                data: {
                    companyId: company.id,
                    username: dto.adminUsername,
                    passwordHash,
                    realName: dto.adminRealName,
                    role: 'admin',
                    phone: dto.phone || null,
                    avatarColor: avatarColors[0],
                },
            });
            return { company, admin };
        });
        this.logger.log(`新公司注册: ${result.company.code} - ${result.company.name}`);
        const payload = this.buildPayload(result.admin, result.company, 'h5');
        const token = this.jwtService.sign(payload);
        return {
            token,
            company: {
                id: Number(result.company.id),
                code: result.company.code,
                name: result.company.name,
            },
            user: {
                id: Number(result.admin.id),
                companyId: Number(result.company.id),
                companyCode: result.company.code,
                companyName: result.company.name,
                username: result.admin.username,
                realName: result.admin.realName,
                role: result.admin.role,
                avatarColor: result.admin.avatarColor,
            },
        };
    }
    async loginWithWechat(dto) {
        const company = await this.prisma.company.findUnique({
            where: { code: dto.companyCode },
        });
        if (!company) {
            throw new common_1.UnauthorizedException('公司代码不存在');
        }
        const openid = await this.code2Session(dto.code);
        if (!openid) {
            throw new common_1.UnauthorizedException('微信登录失败: 无法获取 openid');
        }
        const user = await this.prisma.sysUser.findFirst({
            where: { companyId: company.id, wxOpenid: openid },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('该微信号未绑定系统账号，请联系管理员绑定');
        }
        if (user.status !== 1) {
            throw new common_1.UnauthorizedException('账号已被禁用，请联系管理员');
        }
        await this.prisma.sysUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const payload = this.buildPayload(user, company, 'mp');
        const token = this.jwtService.sign(payload);
        return {
            token,
            user: {
                id: Number(user.id),
                companyId: Number(company.id),
                companyCode: company.code,
                companyName: company.name,
                username: user.username,
                realName: user.realName,
                role: user.role,
                avatarColor: user.avatarColor,
                customerId: user.customerId ? Number(user.customerId) : null,
            },
        };
    }
    async getCurrentUser(userId, companyId) {
        const user = await this.prisma.sysUser.findUnique({
            where: { id: BigInt(userId) },
            include: { company: true, customer: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        return {
            id: Number(user.id),
            companyId: Number(user.companyId),
            companyCode: user.company.code,
            companyName: user.company.name,
            username: user.username,
            realName: user.realName,
            role: user.role,
            phone: user.phone,
            avatarColor: user.avatarColor,
            customerId: user.customerId ? Number(user.customerId) : null,
        };
    }
    async code2Session(code) {
        const appid = process.env.WX_APPID;
        const secret = process.env.WX_SECRET;
        if (!appid || !secret) {
            throw new common_1.UnauthorizedException('微信登录服务未正确配置');
        }
        try {
            const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
            const { data } = await axios_1.default.get(url);
            if (data.errcode) {
                this.logger.error(`微信 code2session 失败: ${data.errcode} ${data.errmsg}`);
                return null;
            }
            return data.openid;
        }
        catch (err) {
            this.logger.error(`微信 code2session 请求异常: ${err.message}`);
            return null;
        }
    }
    buildPayload(user, company, platform) {
        return {
            userId: Number(user.id),
            companyId: Number(company.id),
            username: user.username,
            realName: user.realName,
            role: user.role,
            customerId: user.customerId ? Number(user.customerId) : null,
            platform,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map