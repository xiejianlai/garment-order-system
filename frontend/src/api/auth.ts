/**
 * 认证相关 API
 *
 * 双端登录差异:
 * - 小程序: uni.login() → code → POST /auth/wx-login → JWT
 * - H5:     用户名+密码 → POST /auth/login → JWT
 * - 两端登录成功后都走相同的 token 存储和路由跳转逻辑
 */

import { http } from '../utils/request';
import type { UserInfo } from '../types';

export interface LoginResult {
  token: string;
  user: UserInfo;
}

/** H5 端登录 — 用户名 + 密码 */
export function loginWithPassword(username: string, password: string) {
  return http.post<LoginResult>('/auth/login', { username, password });
}

/** 小程序端登录 — 微信 code */
export function loginWithWechat(code: string, nickName?: string, avatarUrl?: string) {
  return http.post<LoginResult>('/auth/wx-login', { code, nickName, avatarUrl });
}

/** 获取当前用户信息（刷新页面时恢复登录态） */
export function getCurrentUser() {
  return http.get<UserInfo>('/auth/me');
}
