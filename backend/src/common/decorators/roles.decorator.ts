import { SetMetadata } from '@nestjs/common';

/**
 * 角色装饰器 — 标记接口所需角色
 * 用法: @Roles('admin', 'merchandiser')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
