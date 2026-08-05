<template>
  <view class="mine-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar" :style="{ background: userStore.avatarColor || '#185FA5' }">
        <text class="avatar-text">{{ userStore.realName?.charAt(0) || 'U' }}</text>
      </view>
      <view class="user-info">
        <text class="user-name">{{ userStore.realName || '未登录' }}</text>
        <text class="user-role">{{ roleLabel }}</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goOrders">
        <text class="menu-icon">📋</text>
        <text class="menu-label">我的订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" v-if="userStore.isAdmin" @tap="goOrders">
        <text class="menu-icon">➕</text>
        <text class="menu-label">新建订单</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    admin: '管理员',
    coordinator: '理单员',
    merchandiser: '跟单员',
    customer: '客户',
    factory: '工厂',
  };
  return map[userStore.role] || userStore.role || '';
});

function goOrders() {
  uni.switchTab({ url: '/pages/orders/index' });
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.reLaunch({ url: '/pages/login/index' });
      }
    },
  });
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 40rpx 30rpx;
  background: #185FA5;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  font-size: 44rpx;
  color: #fff;
  font-weight: 600;
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.user-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #fff;
}
.user-role {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.menu-section {
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}
.menu-label {
  flex: 1;
  font-size: 28rpx;
  color: #2C2C2A;
}
.menu-arrow {
  font-size: 28rpx;
  color: #B4B2A9;
}

.logout-section {
  padding: 40rpx 30rpx;
}
.logout-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: #fff;
  color: #A32D2D;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: 1rpx solid #A32D2D;
}
</style>
