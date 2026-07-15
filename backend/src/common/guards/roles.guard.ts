import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RBAC 角色守卫 — 检查当前用户是否有访问该接口的角色权限
 *
 * 数据可见性逻辑（在 Service 层实现）:
 * - admin / merchandiser: 可查看所有订单
 * - factory: 仅查看 assigned_factory_id = user.factoryId 的订单
 * - customer: 仅查看 customer_id = user.customerId 的订单
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 未设置 @Roles 装饰器 → 仅需登录即可访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `当前角色(${user.role})无权限访问此资源，需要角色: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
