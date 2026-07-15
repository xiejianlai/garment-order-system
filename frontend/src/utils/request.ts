/**
 * HTTP 请求封装 — 小程序 + H5 双端统一
 *
 * 核心设计:
 * 1. 使用 uni.request — uni-app 已抽象，两端API一致
 * 2. 请求拦截: 自动携带 Authorization: Bearer <token>
 * 3. 响应拦截: 统一处理后端 { code, message, data } 格式
 * 4. 401 处理: token失效自动跳转登录页
 * 5. 错误处理: 统一 showToast 提示
 *
 * 小程序与H5差异:
 * - 小程序无 CORS 限制，直连后端
 * - H5 有 CORS，需后端开启 CORS 或配置代理 (manifest.json devServer.proxy)
 * - 文件上传: 小程序用 uni.uploadFile, H5 也用 uni.uploadFile (已抽象)
 */

import { getToken, removeToken, removeUserInfo } from './auth';

/** 后端API基础地址 */
// 小程序端: 需配置为实际服务器地址 (需要在微信后台配置合法域名)
// H5端: 开发时走 vite proxy 代理, 生产环境配置为实际地址
// #ifdef MP-WEIXIN
const BASE_URL = 'https://your-api-domain.com/api';
// #endif
// #ifdef H5
const BASE_URL = '/api'; // 开发环境走proxy代理
// #endif

/** 统一响应格式 */
export interface ApiResponse<T = any> {
  code: string;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
}

/** 请求配置 */
export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
  showError?: boolean; // 是否自动弹出错误提示
}

/**
 * 核心请求函数
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = false,
    loadingText = '加载中...',
    showError = true,
  } = options;

  if (showLoading) {
    uni.showLoading({ title: loadingText, mask: true });
  }

  // 自动携带 Token
  const token = getToken();
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
      success: (res) => {
        const responseData = res.data as ApiResponse<T>;

        // HTTP 状态码处理
        if (res.statusCode === 401) {
          // Token 失效
          removeToken();
          removeUserInfo();
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' });
          }, 1500);
          reject(new Error('未授权'));
          return;
        }

        if (res.statusCode >= 400) {
          const errMsg = responseData?.message || `请求失败 (${res.statusCode})`;
          if (showError) {
            uni.showToast({ title: errMsg, icon: 'none' });
          }
          reject(new Error(errMsg));
          return;
        }

        // 业务状态码处理
        if (responseData.code === 'SUCCESS') {
          resolve(responseData.data);
        } else {
          const errMsg = responseData.message || '请求失败';
          if (showError) {
            uni.showToast({ title: errMsg, icon: 'none' });
          }
          reject(new Error(errMsg));
        }
      },
      fail: (err) => {
        const errMsg = '网络请求失败，请检查网络连接';
        if (showError) {
          uni.showToast({ title: errMsg, icon: 'none' });
        }
        reject(new Error(errMsg));
      },
      complete: () => {
        if (showLoading) {
          uni.hideLoading();
        }
      },
    });
  });
}

/**
 * 文件上传 — 小程序 + H5 统一使用 uni.uploadFile
 * 两端底层实现不同，但API一致:
 * - 小程序: 底层调用 wx.uploadFile
 * - H5: 底层创建 FormData + XMLHttpRequest
 */
export function uploadFile(
  url: string,
  filePath: string,
  name: string = 'file',
  formData?: Record<string, string>,
): Promise<any> {
  const token = getToken();

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      success: (res) => {
        if (res.statusCode >= 400) {
          reject(new Error(`上传失败 (${res.statusCode})`));
          return;
        }
        const data = JSON.parse(res.data) as ApiResponse;
        if (data.code === 'SUCCESS') {
          resolve(data.data);
        } else {
          reject(new Error(data.message));
        }
      },
      fail: (err) => {
        reject(new Error('文件上传失败'));
      },
    });
  });
}

/** 便捷方法 */
export const http = {
  get: <T = any>(url: string, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'GET', ...opts }),
  post: <T = any>(url: string, data?: any, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'POST', data, ...opts }),
  patch: <T = any>(url: string, data?: any, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'PATCH', data, ...opts }),
  delete: <T = any>(url: string, opts?: Partial<RequestOptions>) =>
    request<T>({ url, method: 'DELETE', ...opts }),
};
