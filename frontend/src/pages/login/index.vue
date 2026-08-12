<!--
  登录页 — 微信小程序 + H5 双端兼容

  核心差异处理:
  1. 条件编译 #ifdef MP-WEIXIN / #ifdef H5 区分平台UI
  2. 小程序: 调用 uni.login() → code → POST /auth/wx-login
  3. H5: 用户名+密码表单 → POST /auth/login
  4. 两端登录成功后逻辑一致: 存 token → 跳转订单列表
-->
<template>
  <view class="login-page">
    <!-- 顶部 Logo 区 -->
    <view class="logo-section">
      <view class="logo-icon">
        <text class="logo-text">GO</text>
      </view>
      <text class="app-title">外贸服装订单系统</text>
      <text class="app-subtitle">Garment Order Management</text>
    </view>

    <!-- ============ H5 端: 公司代码 + 用户名密码登录 ============ -->
    <!-- #ifdef H5 -->
    <view class="form-section">
      <view class="input-group">
        <input
          v-model="formData.companyCode"
          class="input-field"
          type="text"
          placeholder="请输入公司代码"
          placeholder-class="placeholder"
        />
      </view>
      <view class="input-group">
        <input
          v-model="formData.username"
          class="input-field"
          type="text"
          placeholder="请输入用户名"
          placeholder-class="placeholder"
          @confirm="handleLogin"
        />
      </view>
      <view class="input-group">
        <input
          v-model="formData.password"
          class="input-field"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码"
          placeholder-class="placeholder"
          @confirm="handleLogin"
        />
        <text class="toggle-pwd" @tap="showPassword = !showPassword">
          {{ showPassword ? '隐藏' : '显示' }}
        </text>
      </view>
      <button class="login-btn" :loading="loading" @tap="handleLogin">
        登录
      </button>
      <view class="tips">
        <text class="tips-text">提示: 管理员/跟单员/工厂/客户均可使用浏览器登录</text>
      </view>
    </view>
    <!-- #endif -->

    <!-- ============ 微信小程序端: 账号密码登录 + 微信一键登录 ============ -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="form-section">
      <view class="input-group">
        <input
          v-model="formData.companyCode"
          class="input-field"
          type="text"
          placeholder="请输入公司代码"
          placeholder-class="placeholder"
        />
      </view>
      <view class="input-group">
        <input
          v-model="formData.username"
          class="input-field"
          type="text"
          placeholder="请输入用户名"
          placeholder-class="placeholder"
        />
      </view>
      <view class="input-group">
        <input
          v-model="formData.password"
          class="input-field"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入密码"
          placeholder-class="placeholder"
          @confirm="handleLogin"
        />
        <text class="toggle-pwd" @tap="showPassword = !showPassword">
          {{ showPassword ? '隐藏' : '显示' }}
        </text>
      </view>
      <button class="login-btn" :loading="loading" @tap="handleLogin">
        登录
      </button>

      <!-- 分隔线 -->
      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">或</text>
        <view class="divider-line"></view>
      </view>

      <button class="wx-login-btn" :loading="wxLoading" @tap="handleWxLogin">
        <text class="wx-login-text">微信一键登录</text>
      </button>
      <view class="tips">
        <text class="tips-text">首次使用请先用账号密码登录绑定微信</text>
      </view>
    </view>
    <!-- #endif -->

    <!-- 注册公司入口（双端通用） -->
    <view class="register-entry">
      <text class="register-text">没有账号？</text>
      <text class="register-link" @tap="goRegister">注册公司，免费试用 7 天</text>
    </view>

    <!-- 测试账号 (开发环境显示) -->
    <!-- #ifdef H5 -->
    <view class="dev-accounts" v-if="showDevAccounts">
      <view class="dev-title">开发测试账号 (密码均为 123456)</view>
      <view class="dev-item" @tap="fillAccount('admin', '123456')">
        <text>管理员: admin</text>
      </view>
      <view class="dev-item" @tap="fillAccount('zhanggen', '123456')">
        <text>跟单员: zhanggen</text>
      </view>
      <view class="dev-item" @tap="fillAccount('chenchang', '123456')">
        <text>工厂端: chenchang</text>
      </view>
      <view class="dev-item" @tap="fillAccount('john', '123456')">
        <text>客户端: john</text>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { getToken } from '../../utils/auth';

const userStore = useUserStore();
const loading = ref(false);
const wxLoading = ref(false);
const showPassword = ref(false);
const showDevAccounts = ref(true); // 开发环境显示测试账号

const formData = reactive({
  username: '',
  password: '',
  companyCode: '',
});

/** 页面加载时检查是否已有有效 token */
onLoad(() => {
  const token = getToken();
  if (!token) return; // 无 token，留在登录页

  // 有 token，尝试验证。成功则跳转，失败则留在登录页
  userStore.fetchCurrentUser()
    .then(() => {
      // token 有效，跳转订单列表
      uni.switchTab({
        url: '/pages/orders/index',
        fail: () => {
          // switchTab 失败可能是因为已经在该页面或页面未注册
          console.log('已登录，跳转订单列表');
        }
      });
    })
    .catch(() => {
      // token 失效，静默清除（request.ts 的 401 拦截器已处理清除和提示）
      // 不在这里做 reLaunch，避免生命周期冲突
    });
});

/**
 * 密码登录 — 公司代码 + 用户名 + 密码
 * 小程序端登录成功后自动绑定微信
 */
async function handleLogin() {
  if (!formData.companyCode) {
    uni.showToast({ title: '请输入公司代码', icon: 'none' });
    return;
  }
  if (!formData.username || !formData.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    await userStore.loginByPassword(formData.companyCode, formData.username, formData.password);
    uni.showToast({ title: '登录成功', icon: 'success' });

    // #ifdef MP-WEIXIN
    // 小程序端：登录成功后自动绑定微信
    try {
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({ provider: 'weixin', success: resolve, fail: reject });
      });
      if (loginRes.code) {
        await userStore.bindWxAccount(loginRes.code);
        uni.showToast({ title: '微信已绑定，下次可一键登录', icon: 'none' });
      }
    } catch (bindErr) {
      console.error('自动绑定微信失败:', bindErr);
      // 绑定失败不影响登录
    }
    // #endif

    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/index' });
    }, 500);
  } catch (err: any) {
    console.error('登录失败:', err.message);
  } finally {
    loading.value = false;
  }
}

/**
 * 微信小程序登录 — uni.login() 获取 code
 */
async function handleWxLogin() {
  if (!formData.companyCode) {
    uni.showToast({ title: '请输入公司代码', icon: 'none' });
    return;
  }

  wxLoading.value = true;
  try {
    // 1. 调用 uni.login 获取 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject,
      });
    });

    if (!loginRes.code) {
      uni.showToast({ title: '获取微信登录凭证失败', icon: 'none' });
      return;
    }

    // 2. 用 code + companyCode 调用后端换 JWT
    await userStore.loginByWechat(loginRes.code, formData.companyCode);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/index' });
    }, 500);
  } catch (err: any) {
    console.error('微信登录失败:', err.message);
    if (err.message && err.message.includes('未绑定')) {
      uni.showModal({
        title: '需要绑定微信',
        content: '首次使用请先用账号密码登录，系统会自动绑定您的微信。绑定后即可使用微信一键登录。',
        showCancel: false,
      });
    } else {
      uni.showToast({ title: err.message || '微信登录失败', icon: 'none' });
    }
  } finally {
    wxLoading.value = false;
  }
}

/** 填充测试账号 */
function fillAccount(username: string, password: string) {
  formData.companyCode = 'DEMO01';
  formData.username = username;
  formData.password = password;
}

/** 跳转注册公司页 */
function goRegister() {
  uni.navigateTo({ url: '/pages/register/index' });
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx 0;
  background: linear-gradient(180deg, #E6F1FB 0%, #f5f5f5 40%);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 28rpx;
  background: #185FA5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.logo-text {
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 700;
}

.app-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #2C2C2A;
  margin-bottom: 8rpx;
}

.app-subtitle {
  font-size: 24rpx;
  color: #888780;
}

.form-section {
  width: 100%;
}

.input-group {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #e0e0e0;
}

.input-field {
  flex: 1;
  height: 96rpx;
  font-size: 30rpx;
  color: #333333;
}

.placeholder {
  color: #B4B2A9;
}

.toggle-pwd {
  font-size: 24rpx;
  color: #185FA5;
  padding: 10rpx;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #185FA5;
  color: #ffffff;
  font-size: 32rpx;
  border-radius: 16rpx;
  border: none;
  margin-top: 16rpx;
}

.login-btn::after {
  border: none;
}

.wx-login-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #07C160;
  color: #ffffff;
  font-size: 32rpx;
  border-radius: 16rpx;
  border: none;
}

.wx-login-btn::after {
  border: none;
}

.wx-login-text {
  color: #ffffff;
}

.tips {
  margin-top: 32rpx;
  text-align: center;
}

.tips-text {
  font-size: 22rpx;
  color: #888780;
}

.divider {
  display: flex;
  align-items: center;
  margin: 32rpx 0;
}

.register-entry {
  margin-top: 48rpx;
  text-align: center;
  font-size: 26rpx;
  color: #888780;
}
.register-link {
  color: #185FA5;
  font-weight: 500;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: #e0e0e0;
}

.divider-text {
  padding: 0 24rpx;
  font-size: 24rpx;
  color: #B4B2A9;
}

.dev-accounts {
  width: 100%;
  margin-top: 60rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1rpx solid #e0e0e0;
}

.dev-title {
  font-size: 24rpx;
  color: #5F5E5A;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.dev-item {
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #185FA5;
  border-bottom: 1rpx solid #f0f0f0;
}

.dev-item:last-child {
  border-bottom: none;
}
</style>
