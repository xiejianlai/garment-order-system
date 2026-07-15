import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, WxLoginDto } from './dto/login.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 多公司登录 — 公司代码 + 用户名 + 密码
   */
  async loginWithPassword(dto: LoginDto) {
    // 查找公司
    const company = await this.prisma.company.findUnique({
      where: { code: dto.companyCode },
    });
    if (!company) {
      throw new UnauthorizedException('公司代码不存在');
    }
    if (company.status !== 1) {
      throw new UnauthorizedException('该公司已被禁用');
    }

    // 查找用户（公司内唯一）
    const user = await this.prisma.sysUser.findUnique({
      where: {
        companyId_username: {
          companyId: company.id,
          username: dto.username,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用，请联系管理员');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新最后登录时间
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

  /**
   * 公司注册 — 创建公司 + 管理员账号
   */
  async registerCompany(dto: RegisterDto) {
    // 检查公司代码是否已存在
    const existingCompany = await this.prisma.company.findUnique({
      where: { code: dto.companyCode },
    });
    if (existingCompany) {
      throw new BadRequestException('公司代码已被注册');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    const avatarColors = ['#1677ff', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96'];

    // 事务：创建公司 + 管理员
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

    // 自动登录
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

  /**
   * 微信小程序登录 — companyCode + code 换 openid
   */
  async loginWithWechat(dto: WxLoginDto) {
    const company = await this.prisma.company.findUnique({
      where: { code: dto.companyCode },
    });
    if (!company) {
      throw new UnauthorizedException('公司代码不存在');
    }

    const openid = await this.code2Session(dto.code);
    if (!openid) {
      throw new UnauthorizedException('微信登录失败: 无法获取 openid');
    }

    // 在公司范围内查找绑定了该 openid 的用户
    const user = await this.prisma.sysUser.findFirst({
      where: { companyId: company.id, wxOpenid: openid },
    });

    if (!user) {
      throw new UnauthorizedException('该微信号未绑定系统账号，请联系管理员绑定');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用，请联系管理员');
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

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: number, companyId: number) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id: BigInt(userId) },
      include: { company: true, customer: true },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
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

  private async code2Session(code: string): Promise<string | null> {
    const appid = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;
    if (!appid || !secret) {
      throw new UnauthorizedException('微信登录服务未正确配置');
    }
    try {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
      const { data } = await axios.get(url);
      if (data.errcode) {
        this.logger.error(`微信 code2session 失败: ${data.errcode} ${data.errmsg}`);
        return null;
      }
      return data.openid;
    } catch (err) {
      this.logger.error(`微信 code2session 请求异常: ${err.message}`);
      return null;
    }
  }

  private buildPayload(user: any, company: any, platform: 'mp' | 'h5'): JwtPayload {
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
}
