<template>
  <view class="register-page">
    <!-- 试用说明 -->
    <view class="trial-card">
      <view class="trial-title">🎁 新公司免费试用 7 天</view>
      <view class="trial-desc">
        注册即开通 7 天免费试用，可体验全部功能。试用结束后如需继续使用，联系管理员开通正式版即可。
      </view>
    </view>

    <view class="form-card">
      <view class="form-item">
        <text class="form-label required">公司名称</text>
        <input v-model="form.companyName" class="form-input" placeholder="请输入公司/企业名称" placeholder-class="ph" />
      </view>

      <view class="form-item">
        <text class="form-label required">公司代码</text>
        <input v-model="form.companyCode" class="form-input" placeholder="4-20位字母或数字，用于登录，如 ABC01" placeholder-class="ph" maxlength="20" />
      </view>

      <view class="form-item">
        <text class="form-label required">管理员姓名</text>
        <input v-model="form.adminRealName" class="form-input" placeholder="请输入管理员真实姓名" placeholder-class="ph" />
      </view>

      <view class="form-item">
        <text class="form-label required">管理员账号</text>
        <input v-model="form.adminUsername" class="form-input" placeholder="登录账号（公司内唯一）" placeholder-class="ph" maxlength="50" />
      </view>

      <view class="form-item">
        <text class="form-label required">密码</text>
        <input v-model="form.adminPassword" class="form-input" :type="showPwd ? 'text' : 'password'" placeholder="至少6位" placeholder-class="ph" />
      </view>

      <view class="form-item">
        <text class="form-label required">确认密码</text>
        <input v-model="confirmPassword" class="form-input" :type="showPwd ? 'text' : 'password'" placeholder="再次输入密码" placeholder-class="ph" />
        <text class="toggle-pwd" @tap="showPwd = !showPwd">{{ showPwd ? '隐藏' : '显示' }}</text>
      </view>

      <view class="form-item">
        <text class="form-label">联系电话</text>
        <input v-model="form.phone" class="form-input" type="number" placeholder="选填" placeholder-class="ph" maxlength="20" />
      </view>
    </view>

    <button class="register-btn" :loading="loading" @tap="handleRegister">注册并免费试用 7 天</button>

    <view class="footer-tip" @tap="goBackLogin">
      <text>已有账号？</text><text class="link">返回登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();
const loading = ref(false);
const showPwd = ref(false);
const confirmPassword = ref('');

const form = reactive({
  companyName: '',
  companyCode: '',
  adminRealName: '',
  adminUsername: '',
  adminPassword: '',
  phone: '',
});

async function handleRegister() {
  if (!form.companyName.trim()) return uni.showToast({ title: '请输入公司名称', icon: 'none' });
  const code = form.companyCode.trim();
  if (!code) return uni.showToast({ title: '请输入公司代码', icon: 'none' });
  if (!/^[A-Za-z0-9]{4,20}$/.test(code)) return uni.showToast({ title: '公司代码需4-20位字母或数字', icon: 'none' });
  if (!form.adminRealName.trim()) return uni.showToast({ title: '请输入管理员姓名', icon: 'none' });
  if (!form.adminUsername.trim()) return uni.showToast({ title: '请输入管理员账号', icon: 'none' });
  if (!form.adminPassword || form.adminPassword.length < 6) return uni.showToast({ title: '密码至少6位', icon: 'none' });
  if (form.adminPassword !== confirmPassword.value) return uni.showToast({ title: '两次密码不一致', icon: 'none' });

  loading.value = true;
  try {
    const result = await userStore.registerCompanyAccount({
      companyName: form.companyName.trim(),
      companyCode: code,
      adminRealName: form.adminRealName.trim(),
      adminUsername: form.adminUsername.trim(),
      adminPassword: form.adminPassword,
      phone: form.phone.trim() || undefined,
    });
    uni.showToast({ title: '注册成功，已开通7天试用', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/index' });
    }, 800);
  } catch (err: any) {
    // request.ts 已自动 toast 后端错误信息（如"公司代码已被注册"）
    console.error('注册失败:', err.message);
  } finally {
    loading.value = false;
  }
}

function goBackLogin() {
  uni.navigateBack({
    fail: () => uni.reLaunch({ url: '/pages/login/index' }),
  });
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.trial-card {
  background: linear-gradient(135deg, #FFF7E6 0%, #FFFBE8 100%);
  border: 1rpx solid #FFE7A8;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.trial-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #AD6800;
  margin-bottom: 10rpx;
}
.trial-desc {
  font-size: 24rpx;
  color: #8C6B2E;
  line-height: 1.6;
}

.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 10rpx 24rpx;
  margin-bottom: 40rpx;
}
.form-item {
  display: flex;
  align-items: center;
  padding: 26rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.form-item:last-child {
  border-bottom: none;
}
.form-label {
  width: 170rpx;
  font-size: 28rpx;
  color: #2C2C2A;
  flex-shrink: 0;
}
.form-label.required::before {
  content: '* ';
  color: #E64340;
}
.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}
.ph {
  color: #B4B2A9;
}
.toggle-pwd {
  font-size: 24rpx;
  color: #185FA5;
  padding: 10rpx;
}

.register-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #185FA5;
  color: #fff;
  font-size: 32rpx;
  border-radius: 16rpx;
  border: none;
}
.register-btn::after {
  border: none;
}

.footer-tip {
  margin-top: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #888780;
}
.link {
  color: #185FA5;
  margin-left: 8rpx;
}
</style>
