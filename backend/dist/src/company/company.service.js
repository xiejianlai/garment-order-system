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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
let CompanyService = class CompanyService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('CompanyService');
    }
    async getCompanyInfo(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: BigInt(companyId) },
            include: { users: true },
        });
        if (!company)
            throw new common_1.BadRequestException('公司不存在');
        const orderCounts = await this.prisma.order.groupBy({
            by: ['coordinatorId'],
            where: { companyId: BigInt(companyId), coordinatorId: { not: null } },
            _count: { id: true },
        });
        const merOrderCounts = await this.prisma.order.groupBy({
            by: ['merchandiserId'],
            where: { companyId: BigInt(companyId), merchandiserId: { not: null } },
            _count: { id: true },
        });
        const coordMap = new Map(orderCounts.map(r => [Number(r.coordinatorId), r._count.id]));
        const merMap = new Map(merOrderCounts.map(r => [Number(r.merchandiserId), r._count.id]));
        const users = company.users.map(u => ({
            id: Number(u.id),
            username: u.username,
            realName: u.realName,
            role: u.role,
            phone: u.phone,
            avatarColor: u.avatarColor,
            status: u.status === 1 ? 'active' : 'disabled',
            lastLoginAt: u.lastLoginAt?.toISOString() || null,
            orderCount: u.role === 'coordinator' ? (coordMap.get(Number(u.id)) || 0)
                : u.role === 'merchandiser' ? (merMap.get(Number(u.id)) || 0) : null,
        }));
        const unregisteredOrders = await this.prisma.order.findMany({
            where: { companyId: BigInt(companyId) },
            select: { orderNo: true, coordinatorId: true, coordinatorName: true, merchandiserId: true, merchandiserName: true },
        });
        const unregistered = [];
        unregisteredOrders.forEach(o => {
            if (o.coordinatorName && !o.coordinatorId) {
                const existing = unregistered.find(n => n.name === o.coordinatorName && n.role === '理单');
                if (existing)
                    existing.orders.push(o.orderNo);
                else
                    unregistered.push({ name: o.coordinatorName, role: '理单', orders: [o.orderNo] });
            }
            if (o.merchandiserName && !o.merchandiserId) {
                const existing = unregistered.find(n => n.name === o.merchandiserName && n.role === '跟单');
                if (existing)
                    existing.orders.push(o.orderNo);
                else
                    unregistered.push({ name: o.merchandiserName, role: '跟单', orders: [o.orderNo] });
            }
        });
        return {
            id: Number(company.id),
            code: company.code,
            name: company.name,
            createdAt: company.createdAt.toISOString(),
            userCount: users.length,
            orderCount: await this.prisma.order.count({ where: { companyId: BigInt(companyId) } }),
            users,
            unregistered,
        };
    }
    async addMember(companyId, adminId, dto) {
        const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
        if (!admin || admin.role !== 'admin')
            throw new common_1.ForbiddenException('仅管理员可添加成员');
        const existing = await this.prisma.sysUser.findUnique({
            where: { companyId_username: { companyId: BigInt(companyId), username: dto.username } },
        });
        if (existing)
            throw new common_1.BadRequestException('用户名已存在');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const avatarColors = ['#1677ff', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#2f54eb', '#fa541c'];
        const member = await this.prisma.sysUser.create({
            data: {
                companyId: BigInt(companyId),
                username: dto.username,
                passwordHash,
                realName: dto.realName,
                role: dto.role,
                phone: dto.phone || null,
                avatarColor: avatarColors[Math.random() * avatarColors.length | 0],
                customerId: dto.role === 'customer' ? undefined : null,
            },
        });
        await this.syncMemberToOrders(member);
        this.logger.log(`新成员添加: ${dto.realName} (${dto.role}) → 公司 ${companyId}`);
        return {
            id: Number(member.id),
            username: member.username,
            realName: member.realName,
            role: member.role,
            syncedOrders: true,
        };
    }
    async quickRegister(companyId, adminId, dto) {
        const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
        if (!admin || admin.role !== 'admin')
            throw new common_1.ForbiddenException('仅管理员可操作');
        const existing = await this.prisma.sysUser.findUnique({
            where: { companyId_username: { companyId: BigInt(companyId), username: dto.username } },
        });
        if (existing)
            throw new common_1.BadRequestException('用户名已存在');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const avatarColors = ['#13c2c2', '#52c41a', '#08979c', '#389e0d', '#5cdbd3', '#b7eb8f'];
        const member = await this.prisma.sysUser.create({
            data: {
                companyId: BigInt(companyId),
                username: dto.username,
                passwordHash,
                realName: dto.realName,
                role: dto.role,
                phone: dto.phone || null,
                avatarColor: avatarColors[Math.random() * avatarColors.length | 0],
            },
        });
        await this.syncMemberToOrders(member);
        return {
            id: Number(member.id),
            realName: member.realName,
            role: member.role,
            syncedOrders: true,
        };
    }
    async updateMember(companyId, adminId, memberId, dto) {
        const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
        if (!admin || admin.role !== 'admin')
            throw new common_1.ForbiddenException('仅管理员可操作');
        const member = await this.prisma.sysUser.findUnique({ where: { id: BigInt(memberId) } });
        if (!member)
            throw new common_1.BadRequestException('成员不存在');
        if (member.companyId !== BigInt(companyId))
            throw new common_1.ForbiddenException('不能跨公司操作');
        if (member.role === 'admin' && dto.role !== 'admin') {
            const adminCount = await this.prisma.sysUser.count({
                where: { companyId: BigInt(companyId), role: 'admin', status: 1 },
            });
            if (adminCount <= 1)
                throw new common_1.BadRequestException('最后一个管理员，不可更改角色');
        }
        if (dto.username !== member.username) {
            const existing = await this.prisma.sysUser.findUnique({
                where: { companyId_username: { companyId: BigInt(companyId), username: dto.username } },
            });
            if (existing)
                throw new common_1.BadRequestException('用户名已存在');
        }
        const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : member.passwordHash;
        const updated = await this.prisma.sysUser.update({
            where: { id: BigInt(memberId) },
            data: {
                realName: dto.realName,
                username: dto.username,
                passwordHash,
                phone: dto.phone || null,
                role: dto.role,
                status: dto.status === 'active' ? 1 : 0,
            },
        });
        if (dto.realName !== member.realName) {
            if (member.role === 'coordinator' || dto.role === 'coordinator') {
                await this.prisma.order.updateMany({
                    where: { coordinatorId: BigInt(memberId) },
                    data: { coordinatorName: dto.realName },
                });
            }
            if (member.role === 'merchandiser' || dto.role === 'merchandiser') {
                await this.prisma.order.updateMany({
                    where: { merchandiserId: BigInt(memberId) },
                    data: { merchandiserName: dto.realName },
                });
            }
        }
        await this.syncMemberToOrders(updated);
        return {
            id: Number(updated.id),
            realName: updated.realName,
            role: updated.role,
        };
    }
    async deleteMember(companyId, adminId, memberId) {
        const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
        if (!admin || admin.role !== 'admin')
            throw new common_1.ForbiddenException('仅管理员可操作');
        const member = await this.prisma.sysUser.findUnique({ where: { id: BigInt(memberId) } });
        if (!member)
            throw new common_1.BadRequestException('成员不存在');
        if (member.role === 'admin') {
            const adminCount = await this.prisma.sysUser.count({
                where: { companyId: BigInt(companyId), role: 'admin', status: 1 },
            });
            if (adminCount <= 1)
                throw new common_1.BadRequestException('最后一个管理员不可删除');
        }
        await this.prisma.sysUser.delete({ where: { id: BigInt(memberId) } });
        return { deleted: true, realName: member.realName };
    }
    async syncMemberToOrders(member) {
        if (member.role === 'coordinator') {
            await this.prisma.order.updateMany({
                where: {
                    companyId: member.companyId,
                    coordinatorName: member.realName,
                    coordinatorId: null,
                },
                data: { coordinatorId: member.id },
            });
        }
        if (member.role === 'merchandiser') {
            await this.prisma.order.updateMany({
                where: {
                    companyId: member.companyId,
                    merchandiserName: member.realName,
                    merchandiserId: null,
                },
                data: { merchandiserId: member.id },
            });
        }
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyService);
//# sourceMappingURL=company.service.js.map