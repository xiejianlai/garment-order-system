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

    <!-- ============ H5 端: 用户名密码登录 ============ -->
    <!-- #ifdef H5 -->
    <view class="form-section">
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

    <!-- ============ 微信小程序端: 微信一键登录 ============ -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="form-section">
      <button class="wx-login-btn" :loading="loading" open-type="getUserInfo" @tap="handleWxLogin">
        <text class="wx-login-text">微信一键登录</text>
      </button>
      <view class="tips">
        <text class="tips-text">提示: 首次使用需管理员在后台绑定您的微信号</text>
      </view>
    </view>
    <!-- #endif -->

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
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();
const loading = ref(false);
const showPassword = ref(false);
const showDevAccounts = ref(true); // 开发环境显示测试账号

const formData = reactive({
  username: '',
  password: '',
});

/**
 * H5 登录 — 用户名 + 密码
 */
async function handleLogin() {
  if (!formData.username || !formData.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    await userStore.loginByPassword(formData.username, formData.password);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/index' });
    }, 500);
  } catch (err: any) {
    // 错误已由 request.ts 统一提示
    console.error('登录失败:', err.message);
  } finally {
    loading.value = false;
  }
}

/**
 * 微信小程序登录 — uni.login() 获取 code
 */
async function handleWxLogin() {
  loading.value = true;
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

    // 2. 用 code 调用后端换 JWT
    await userStore.loginByWechat(loginRes.code);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/index' });
    }, 500);
  } catch (err: any) {
    console.error('微信登录失败:', err.message);
    uni.showToast({ title: err.message || '微信登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

/** 填充测试账号 */
function fillAccount(username: string, password: string) {
  formData.username = username;
  formData.password = password;
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
