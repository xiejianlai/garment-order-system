/**
 * 用户状态管理 — Pinia Store
 *
 * 管理:
 * - 用户信息
 * - 登录/登出逻辑
 * - 登录状态恢复
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginWithPassword, loginWithWechat, getCurrentUser } from '../api/auth';
import { setToken, setUserInfo, removeToken, removeUserInfo, getToken } from '../utils/auth';
import type { UserInfo, UserRole } from '../types';
import { ROLE_LABELS } from '../types';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null);
  const isLoggedIn = computed(() => !!getToken() && !!userInfo.value);

  /** 当前用户角色 */
  const role = computed<UserRole | null>(() => userInfo.value?.role || null);

  /** 角色中文 */
  const roleLabel = computed(() => (role.value ? ROLE_LABELS[role.value] : ''));

  /** 是否管理端 */
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'merchandiser');

  /** 是否工厂端 */
  const isFactory = computed(() => role.value === 'factory');

  /** 是否客户端 */
  const isCustomer = computed(() => role.value === 'customer');

  /**
   * H5 登录 — 用户名密码
   */
  async function loginByPassword(username: string, password: string) {
    const result = await loginWithPassword(username, password);
    setToken(result.token);
    setUserInfo(result.user);
    userInfo.value = result.user;
    return result;
  }

  /**
   * 小程序登录 — 微信 code
   */
  async function loginByWechat(code: string, nickName?: string, avatarUrl?: string) {
    const result = await loginWithWechat(code, nickName, avatarUrl);
    setToken(result.token);
    setUserInfo(result.user);
    userInfo.value = result.user;
    return result;
  }

  /**
   * 获取当前用户信息 — 页面刷新时恢复登录态
   */
  async function fetchCurrentUser() {
    const user = await getCurrentUser();
    setUserInfo(user);
    userInfo.value = user;
    return user;
  }

  /**
   * 登出
   */
  function logout() {
    removeToken();
    removeUserInfo();
    userInfo.value = null;
    uni.reLaunch({ url: '/pages/login/index' });
  }

  return {
    userInfo,
    isLoggedIn,
    role,
    roleLabel,
    isAdmin,
    isFactory,
    isCustomer,
    loginByPassword,
    loginByWechat,
    fetchCurrentUser,
    logout,
  };
});
