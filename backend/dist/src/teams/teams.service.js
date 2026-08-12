"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TeamsService = class TeamsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('TeamsService');
    }
    async listTeams(companyId) {
        const teams = await this.prisma.team.findMany({
            where: { companyId: BigInt(companyId) },
            orderBy: { id: 'asc' },
            include: {
                _count: { select: { users: true } },
                users: { select: { id: true, realName: true, role: true } },
            },
        });
        return teams.map(t => ({
            id: Number(t.id),
            name: t.name,
            remark: t.remark,
            status: t.status === 1 ? 'active' : 'disabled',
            memberCount: t._count.users,
            members: t.users.map(u => ({ id: Number(u.id), realName: u.realName, role: u.role })),
            createdAt: t.createdAt.toISOString(),
        }));
    }
    async createTeam(companyId, adminId, dto) {
        await this.assertAdmin(adminId);
        const name = dto.name.trim();
        const existing = await this.prisma.team.findUnique({
            where: { companyId_name: { companyId: BigInt(companyId), name } },
        });
        if (existing)
            throw new common_1.BadRequestException('团队名称已存在');
        const team = await this.prisma.team.create({
            data: {
                companyId: BigInt(companyId),
                name,
                remark: dto.remark?.trim() || null,
            },
        });
        this.logger.log(`团队创建: ${name} → 公司 ${companyId}`);
        return { id: Number(team.id), name: team.name, remark: team.remark };
    }
    async updateTeam(companyId, adminId, teamId, dto) {
        await this.assertAdmin(adminId);
        const team = await this.prisma.team.findUnique({ where: { id: BigInt(teamId) } });
        if (!team)
            throw new common_1.BadRequestException('团队不存在');
        if (team.companyId !== BigInt(companyId))
            throw new common_1.ForbiddenException('不能跨公司操作');
        const name = dto.name.trim();
        if (name !== team.name) {
            const existing = await this.prisma.team.findUnique({
                where: { companyId_name: { companyId: BigInt(companyId), name } },
            });
            if (existing)
                throw new common_1.BadRequestException('团队名称已存在');
        }
        const updated = await this.prisma.team.update({
            where: { id: BigInt(teamId) },
            data: { name, remark: dto.remark?.trim() ?? team.remark },
        });
        return { id: Number(updated.id), name: updated.name, remark: updated.remark };
    }
    async deleteTeam(companyId, adminId, teamId) {
        await this.assertAdmin(adminId);
        const team = await this.prisma.team.findUnique({
            where: { id: BigInt(teamId) },
            include: { _count: { select: { users: true } } },
        });
        if (!team)
            throw new common_1.BadRequestException('团队不存在');
        if (team.companyId !== BigInt(companyId))
            throw new common_1.ForbiddenException('不能跨公司操作');
        if (team._count.users > 0) {
            throw new common_1.BadRequestException(`该团队下还有 ${team._count.users} 名成员，请先移出成员再删除`);
        }
        await this.prisma.team.delete({ where: { id: BigInt(teamId) } });
        this.logger.log(`团队删除: ${team.name} → 公司 ${companyId}`);
        return { deleted: true, name: team.name };
    }
    async assertAdmin(adminId) {
        const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
        if (!admin || admin.role !== 'admin')
            throw new common_1.ForbiddenException('仅管理员可操作');
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map