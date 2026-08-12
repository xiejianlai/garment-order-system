/**
 * 公司 / 团队 / 成员管理 API
 */

import { http } from '../utils/request';
import type { TrialInfo } from '../types';

export interface TeamInfo {
  id: number;
  name: string;
  remark?: string | null;
  status: string;
  memberCount: number;
  createdAt?: string;
}

export interface MemberInfo {
  id: number;
  username: string;
  realName: string;
  role: string;
  phone?: string | null;
  avatarColor?: string | null;
  status: 'active' | 'disabled';
  lastLoginAt?: string | null;
  orderCount?: number | null;
  teamId?: number | null;
  teamName?: string | null;
}

export interface CompanyInfo {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  userCount: number;
  orderCount: number;
  trial: {
    plan: string;
    trialStartedAt: string | null;
    trialEndsAt: string | null;
    daysLeft: number;
  };
  users: MemberInfo[];
  teams: TeamInfo[];
  unregistered: { name: string; role: string; orders: string[] }[];
}

/** 获取公司信息（含成员、团队、试用状态） */
export function getCompanyInfo(): Promise<CompanyInfo> {
  return http.get<CompanyInfo>('/company/info');
}

/** 创建团队（管理员） */
export function createTeam(name: string, remark?: string) {
  return http.post<TeamInfo>('/teams', { name, remark });
}

/** 更新团队（管理员） */
export function updateTeam(id: number, name: string, remark?: string) {
  return http.put<TeamInfo>(`/teams/${id}`, { name, remark });
}

/** 删除团队（管理员） */
export function deleteTeam(id: number) {
  return http.delete<{ deleted: boolean }>(`/teams/${id}`);
}

/** 添加成员（管理员） */
export function addMember(data: {
  realName: string;
  username: string;
  password: string;
  role: string;
  phone?: string;
  teamId?: number | null;
}) {
  return http.post('/company/members', data);
}

/** 更新成员（管理员） */
export function updateMember(
  id: number,
  data: {
    realName: string;
    username: string;
    password?: string;
    role: string;
    status: string;
    phone?: string;
    teamId?: number | null;
  },
) {
  return http.put(`/company/members/${id}`, data);
}

/** 删除成员（管理员） */
export function deleteMember(id: number) {
  return http.delete<{ deleted: boolean }>(`/company/members/${id}`);
}

/** 试用续期（管理员） */
export function extendTrial(days: number) {
  return http.post<{ plan: string; trialEndsAt: string; daysLeft: number; message: string }>(
    '/company/extend-trial',
    { days },
  );
}

/** 开通正式版（管理员） */
export function activateCompany() {
  return http.post<{ plan: string; message: string }>('/company/activate');
}
