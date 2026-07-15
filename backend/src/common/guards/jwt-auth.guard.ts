import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 认证守卫
 * 统一拦截: 从 Authorization: Bearer <token> 头中解析 JWT
 * 小程序和 H5 都使用相同的 JWT 格式
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
