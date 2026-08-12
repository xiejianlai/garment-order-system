/**
 * 认证相关 API
 *
 * 双端登录差异:
 * - 小程序: uni.login() → code → POST /auth/wx-login → JWT
 * - H5:     用户名+密码 → POST /auth/login → JWT
 * - 两端登录成功后都走相同的 token 存储和路由跳转逻辑
 */

import { http } from '../utils/request';
import type { UserInfo, TrialInfo } from '../types';

export interface LoginResult {
  token: string;
  user: UserInfo;
  trial?: TrialInfo;
}

export interface RegisterResult {
  token: string;
  company: { id: number; code: string; name: string };
  user: UserInfo;
  trial?: TrialInfo;
}

/** 登录 — 公司代码 + 用户名 + 密码 */
export function loginWithPassword(companyCode: string, username: string, password: string) {
  return http.post<LoginResult>('/auth/login', { companyCode, username, password });
}

/** 注册公司 — 自动开通7天免费试用并自动登录 */
export function registerCompany(data: {
  companyName: string;
  companyCode: string;
  adminRealName: string;
  adminUsername: string;
  adminPassword: string;
  phone?: string;
}) {
  return http.post<RegisterResult>('/auth/register', data);
}

/** 小程序端登录 — 微信 code + 公司代码 */
export function loginWithWechat(code: string, companyCode: string, nickName?: string, avatarUrl?: string) {
  return http.post<LoginResult>('/auth/wx-login', { code, companyCode, nickName, avatarUrl });
}

/** 绑定微信 — 已登录用户，用 code 换 openid 绑定到当前账号 */
export function bindWechat(code: string) {
  return http.post<{ success: boolean; message: string }>('/auth/wx-bind', { code });
}

/** 获取当前用户信息（刷新页面时恢复登录态） */
export function getCurrentUser() {
  return http.get<UserInfo>('/auth/me');
}
