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

    <!-- 试用状态卡片 -->
    <view v-if="trialInfo" class="trial-card" :class="'trial-' + trialInfo.plan.toLowerCase()">
      <view class="trial-left">
        <text class="trial-badge">{{ trialBadge }}</text>
        <text class="trial-desc">{{ trialDesc }}</text>
      </view>
      <text class="trial-days" v-if="trialInfo.isTrial">剩 {{ trialInfo.daysLeft }} 天</text>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goOrders">
        <text class="menu-icon">📋</text>
        <text class="menu-label">我的订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" v-if="userStore.isManager" @tap="goOrders">
        <text class="menu-icon">➕</text>
        <text class="menu-label">新建订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" v-if="userStore.isAdmin" @tap="goTeamManage">
        <text class="menu-icon">👥</text>
        <text class="menu-label">团队管理</text>
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

const trialInfo = computed(() => userStore.trialInfo);

const trialBadge = computed(() => {
  if (!trialInfo.value) return '';
  if (trialInfo.value.isActive) return '正式版';
  if (trialInfo.value.isTrial) return '试用中';
  return '已结束';
});

const trialDesc = computed(() => {
  if (!trialInfo.value) return '';
  if (trialInfo.value.isActive) return '公司已开通正式版服务';
  if (trialInfo.value.isTrial) return `免费试用至 ${formatTrialEnd(trialInfo.value.trialEndsAt)}`;
  return '试用已结束，请联系管理员开通正式版';
});

function formatTrialEnd(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

function goTeamManage() {
  uni.navigateTo({ url: '/pages/team-manage/index' });
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

/* 试用状态卡片 */
.trial-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
}
.trial-active {
  background: #E8F5EE;
  border: 1rpx solid #2E9E63;
}
.trial-trial {
  background: #FFF7E8;
  border: 1rpx solid #F0A63A;
}
.trial-expired {
  background: #FDECEC;
  border: 1rpx solid #D93B3B;
}
.trial-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.trial-badge {
  font-size: 26rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  color: #fff;
}
.trial-active .trial-badge { background: #2E9E63; }
.trial-trial .trial-badge { background: #F0A63A; }
.trial-expired .trial-badge { background: #D93B3B; }
.trial-desc {
  font-size: 24rpx;
  color: #5A5A55;
}
.trial-days {
  font-size: 28rpx;
  font-weight: 700;
  color: #E88C1A;
  flex-shrink: 0;
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
