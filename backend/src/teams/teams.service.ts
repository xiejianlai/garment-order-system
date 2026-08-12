import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger('TeamsService');

  constructor(private prisma: PrismaService) {}

  /**
   * 团队列表（公司内）— 所有登录用户可见
   */
  async listTeams(companyId: number) {
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

  /**
   * 创建团队 — 仅管理员
   */
  async createTeam(companyId: number, adminId: number, dto: CreateTeamDto) {
    await this.assertAdmin(adminId);

    const name = dto.name.trim();
    const existing = await this.prisma.team.findUnique({
      where: { companyId_name: { companyId: BigInt(companyId), name } },
    });
    if (existing) throw new BadRequestException('团队名称已存在');

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

  /**
   * 更新团队 — 仅管理员
   */
  async updateTeam(companyId: number, adminId: number, teamId: number, dto: UpdateTeamDto) {
    await this.assertAdmin(adminId);

    const team = await this.prisma.team.findUnique({ where: { id: BigInt(teamId) } });
    if (!team) throw new BadRequestException('团队不存在');
    if (team.companyId !== BigInt(companyId)) throw new ForbiddenException('不能跨公司操作');

    const name = dto.name.trim();
    if (name !== team.name) {
      const existing = await this.prisma.team.findUnique({
        where: { companyId_name: { companyId: BigInt(companyId), name } },
      });
      if (existing) throw new BadRequestException('团队名称已存在');
    }

    const updated = await this.prisma.team.update({
      where: { id: BigInt(teamId) },
      data: { name, remark: dto.remark?.trim() ?? team.remark },
    });

    return { id: Number(updated.id), name: updated.name, remark: updated.remark };
  }

  /**
   * 删除团队 — 仅管理员；团队内有成员时禁止删除
   */
  async deleteTeam(companyId: number, adminId: number, teamId: number) {
    await this.assertAdmin(adminId);

    const team = await this.prisma.team.findUnique({
      where: { id: BigInt(teamId) },
      include: { _count: { select: { users: true } } },
    });
    if (!team) throw new BadRequestException('团队不存在');
    if (team.companyId !== BigInt(companyId)) throw new ForbiddenException('不能跨公司操作');

    if (team._count.users > 0) {
      throw new BadRequestException(`该团队下还有 ${team._count.users} 名成员，请先移出成员再删除`);
    }

    await this.prisma.team.delete({ where: { id: BigInt(teamId) } });
    this.logger.log(`团队删除: ${team.name} → 公司 ${companyId}`);
    return { deleted: true, name: team.name };
  }

  /**
   * 校验操作者是管理员
   */
  private async assertAdmin(adminId: number) {
    const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
    if (!admin || admin.role !== 'admin') throw new ForbiddenException('仅管理员可操作');
  }
}
