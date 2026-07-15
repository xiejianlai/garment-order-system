/**
 * Token 管理工具
 *
 * 小程序: uni.getStorageSync → 底层调用 wx.getStorageSync
 * H5: uni.getStorageSync → 底层调用 localStorage
 * uni-app 已抽象，两端代码完全一致
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'userInfo';

export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || '';
}

export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token);
}

export function removeToken(): void {
  uni.removeStorageSync(TOKEN_KEY);
}

export function getUserInfo(): any {
  const raw = uni.getStorageSync(USER_KEY);
  return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
}

export function setUserInfo(info: any): void {
  uni.setStorageSync(USER_KEY, info);
}

export function removeUserInfo(): void {
  uni.removeStorageSync(USER_KEY);
}

/**
 * 判断当前运行平台
 * 小程序端: 返回 'mp'
 * H5端: 返回 'h5'
 */
export function getPlatform(): 'mp' | 'h5' {
  // #ifdef MP-WEIXIN
  return 'mp';
  // #endif
  // #ifdef H5
  return 'h5';
  // #endif
  // #ifdef APP-PLUS
  return 'h5'; // App端按H5逻辑处理
  // #endif
  return 'h5';
}
