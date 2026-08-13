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
import { loginWithPassword, loginWithWechat, bindWechat, getCurrentUser, registerCompany } from '../api/auth';
import { setToken, setUserInfo, removeToken, removeUserInfo, getToken } from '../utils/auth';
import type { UserInfo, UserRole, TrialInfo } from '../types';
import { ROLE_LABELS } from '../types';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null);
  const trial = ref<TrialInfo | null>(null);
  const isLoggedIn = computed(() => !!getToken() && !!userInfo.value);

  /** 当前用户角色 */
  const role = computed<UserRole | null>(() => userInfo.value?.role || null);

  /** 角色中文 */
  const roleLabel = computed(() => (role.value ? ROLE_LABELS[role.value] : ''));

  /** 是否管理员（公司总账号） */
  const isAdmin = computed(() => role.value === 'admin');

  /** 是否理单员 */
  const isCoordinator = computed(() => role.value === 'coordinator');

  /** 是否跟单员 */
  const isMerchandiser = computed(() => role.value === 'merchandiser');

  /** 是否管理端（管理员+理单+跟单） */
  const isManager = computed(() => role.value === 'admin' || role.value === 'coordinator' || role.value === 'merchandiser');

  /** 可管理物料进度（管理员+理单；跟单无物料权限） */
  const canManageTrims = computed(() => role.value === 'admin' || role.value === 'coordinator');

  /** 可更新T&A进度（管理员+理单+跟单，跟单不含出货阶段） */
  const canUpdateTa = computed(() => role.value === 'admin' || role.value === 'coordinator' || role.value === 'merchandiser');

  /** 可更新出货阶段T&A进度（管理员+理单） */
  const canUpdateTaShipping = computed(() => role.value === 'admin' || role.value === 'coordinator');

  /** 可编辑订单基础信息（管理员+理单） */
  const canEditOrder = computed(() => role.value === 'admin' || role.value === 'coordinator');

  /** 是否工厂端 */
  const isFactory = computed(() => role.value === 'factory');

  /** 是否客户端 */
  const isCustomer = computed(() => role.value === 'customer');

  /** 试用信息（后端随登录/注册/me 返回） */
  const trialInfo = computed(() => trial.value || userInfo.value?.trial || null);

  /**
   * 密码登录 — 公司代码 + 用户名 + 密码
   */
  async function loginByPassword(companyCode: string, username: string, password: string) {
    const result = await loginWithPassword(companyCode, username, password);
    setToken(result.token);
    setUserInfo(result.user);
    userInfo.value = result.user;
    if (result.trial) trial.value = result.trial;
    return result;
  }

  /**
   * 小程序登录 — 微信 code + 公司代码
   */
  async function loginByWechat(code: string, companyCode: string, nickName?: string, avatarUrl?: string) {
    const result = await loginWithWechat(code, companyCode, nickName, avatarUrl);
    setToken(result.token);
    setUserInfo(result.user);
    userInfo.value = result.user;
    if (result.trial) trial.value = result.trial;
    return result;
  }

  /**
   * 注册公司 — 自动开通7天试用并自动登录
   */
  async function registerCompanyAccount(data: {
    companyName: string;
    companyCode: string;
    adminRealName: string;
    adminUsername: string;
    adminPassword: string;
    phone?: string;
  }) {
    const result = await registerCompany(data);
    setToken(result.token);
    setUserInfo(result.user);
    userInfo.value = result.user;
    if (result.trial) trial.value = result.trial;
    return result;
  }

  /**
   * 绑定微信 — 已登录用户，用 code 绑定 openid
   */
  async function bindWxAccount(code: string) {
    return await bindWechat(code);
  }

  /**
   * 获取当前用户信息 — 页面刷新时恢复登录态
   */
  async function fetchCurrentUser() {
    const user = await getCurrentUser();
    setUserInfo(user);
    userInfo.value = user;
    if (user.trial) trial.value = user.trial;
    return user;
  }

  /**
   * 登出
   */
  function logout() {
    removeToken();
    removeUserInfo();
    userInfo.value = null;
    trial.value = null;
    uni.reLaunch({ url: '/pages/login/index' });
  }

  return {
    userInfo,
    isLoggedIn,
    role,
    roleLabel,
    isAdmin,
    isCoordinator,
    isMerchandiser,
    isManager,
    canManageTrims,
    canUpdateTa,
    canUpdateTaShipping,
    canEditOrder,
    isFactory,
    isCustomer,
    trialInfo,
    loginByPassword,
    loginByWechat,
    registerCompanyAccount,
    bindWxAccount,
    fetchCurrentUser,
    logout,
  };
});
