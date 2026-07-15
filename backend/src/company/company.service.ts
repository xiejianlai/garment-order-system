import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto, UpdateMemberDto, QuickRegisterDto } from './dto/company.dto';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger('CompanyService');

  constructor(private prisma: PrismaService) {}

  /**
   * 获取公司信息 + 团队成员列表 + 订单数量统计
   */
  async getCompanyInfo(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: BigInt(companyId) },
      include: { users: true },
    });
    if (!company) throw new BadRequestException('公司不存在');

    // 计算每个理单/跟单负责的订单数
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

    // 查找待注册成员：在订单中被指定了名字但没有关联用户ID
    const unregisteredOrders = await this.prisma.order.findMany({
      where: { companyId: BigInt(companyId) },
      select: { orderNo: true, coordinatorId: true, coordinatorName: true, merchandiserId: true, merchandiserName: true },
    });

    const unregistered: { name: string; role: string; orders: string[] }[] = [];
    unregisteredOrders.forEach(o => {
      if (o.coordinatorName && !o.coordinatorId) {
        const existing = unregistered.find(n => n.name === o.coordinatorName && n.role === '理单');
        if (existing) existing.orders.push(o.orderNo);
        else unregistered.push({ name: o.coordinatorName, role: '理单', orders: [o.orderNo] });
      }
      if (o.merchandiserName && !o.merchandiserId) {
        const existing = unregistered.find(n => n.name === o.merchandiserName && n.role === '跟单');
        if (existing) existing.orders.push(o.orderNo);
        else unregistered.push({ name: o.merchandiserName, role: '跟单', orders: [o.orderNo] });
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

  /**
   * 添加团队成员 — 管理员操作
   * 创建后自动同步到已有订单（名字匹配 → 关联ID）
   */
  async addMember(companyId: number, adminId: number, dto: AddMemberDto) {
    // 验证操作者是管理员
    const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
    if (!admin || admin.role !== 'admin') throw new ForbiddenException('仅管理员可添加成员');

    // 检查用户名在公司内唯一
    const existing = await this.prisma.sysUser.findUnique({
      where: { companyId_username: { companyId: BigInt(companyId), username: dto.username } },
    });
    if (existing) throw new BadRequestException('用户名已存在');

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

    // 自动同步：关联已有订单中的同名记录
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

  /**
   * 快速注册待注册成员 — 从 unregistered 列表一键注册
   */
  async quickRegister(companyId: number, adminId: number, dto: QuickRegisterDto) {
    const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
    if (!admin || admin.role !== 'admin') throw new ForbiddenException('仅管理员可操作');

    const existing = await this.prisma.sysUser.findUnique({
      where: { companyId_username: { companyId: BigInt(companyId), username: dto.username } },
    });
    if (existing) throw new BadRequestException('用户名已存在');

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

  /**
   * 更新成员信息 — 管理员操作
   * 更新 realName 时同步更新关联订单中的名字引用
   */
  async updateMember(companyId: number, adminId: number, memberId: number, dto: UpdateMemberDto) {
    const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
    if (!admin || admin.role !== 'admin') throw new ForbiddenException('仅管理员可操作');

    const member = await this.prisma.sysUser.findUnique({ where: { id: BigInt(memberId) } });
    if (!member) throw new BadRequestException('成员不存在');
    if (member.companyId !== BigInt(companyId)) throw new ForbiddenException('不能跨公司操作');

    // 保护最后一个管理员
    if (member.role === 'admin' && dto.role !== 'admin') {
      const adminCount = await this.prisma.sysUser.count({
        where: { companyId: BigInt(companyId), role: 'admin', status: 1 },
      });
      if (adminCount <= 1) throw new BadRequestException('最后一个管理员，不可更改角色');
    }

    // 检查新用户名唯一性
    if (dto.username !== member.username) {
      const existing = await this.prisma.sysUser.findUnique({
        where: { companyId_username: { companyId: BigInt(companyId), username: dto.username } },
      });
      if (existing) throw new BadRequestException('用户名已存在');
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

    // 同步更新订单中的名字引用
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

    // 如果角色变更，重新同步
    await this.syncMemberToOrders(updated);

    return {
      id: Number(updated.id),
      realName: updated.realName,
      role: updated.role,
    };
  }

  /**
   * 删除成员 — 管理员操作
   */
  async deleteMember(companyId: number, adminId: number, memberId: number) {
    const admin = await this.prisma.sysUser.findUnique({ where: { id: BigInt(adminId) } });
    if (!admin || admin.role !== 'admin') throw new ForbiddenException('仅管理员可操作');

    const member = await this.prisma.sysUser.findUnique({ where: { id: BigInt(memberId) } });
    if (!member) throw new BadRequestException('成员不存在');

    if (member.role === 'admin') {
      const adminCount = await this.prisma.sysUser.count({
        where: { companyId: BigInt(companyId), role: 'admin', status: 1 },
      });
      if (adminCount <= 1) throw new BadRequestException('最后一个管理员不可删除');
    }

    await this.prisma.sysUser.delete({ where: { id: BigInt(memberId) } });
    return { deleted: true, realName: member.realName };
  }

  /**
   * 自动同步：将新成员/更新成员关联到已有订单中同名但无ID的记录
   */
  private async syncMemberToOrders(member: any) {
    if (member.role === 'coordinator') {
      // 找到所有 coordinatorName 等于该成员名字但没有 coordinatorId 的订单
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
}
