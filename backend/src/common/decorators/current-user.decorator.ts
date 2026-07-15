import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户装饰器 — 从 JWT payload 中提取用户信息
 * 用法: @CurrentUser() user: JwtPayload
 */
export interface JwtPayload {
  userId: number;
  companyId: number;       // 多公司数据隔离核心字段
  username: string;
  realName: string;
  role: string;            // admin | coordinator | merchandiser | customer
  customerId: number | null;
  platform: 'mp' | 'h5';
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
