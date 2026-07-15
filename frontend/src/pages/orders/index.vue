<!--
  订单列表页 — 小程序 + H5 双端

  功能:
  1. 按角色过滤订单 (后端已处理，前端只调接口)
  2. 状态筛选 Tab
  3. 下拉刷新 + 上拉加载
  4. 点击跳转订单详情
-->
<template>
  <view class="orders-page">
    <!-- 顶部用户信息栏 -->
    <view class="header">
      <view class="header-left">
        <text class="header-title">订单列表</text>
      </view>
      <view class="header-right">
        <text v-if="userStore.isAdmin" class="create-btn" @tap="goCreate">+ 新建</text>
        <view @tap="handleLogout">
          <text class="user-name">{{ userStore.userInfo?.realName }}</text>
          <text class="user-role tag tag-blue">{{ userStore.roleLabel }}</text>
        </view>
      </view>
    </view>

    <!-- 状态筛选 Tab -->
    <scroll-view scroll-x class="status-tabs">
      <view
        v-for="tab in statusTabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentStatus === tab.value }"
        @tap="switchStatus(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <scroll-view
      scroll-y
      class="order-list"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <view
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        @tap="goDetail(order.id)"
      >
        <!-- 订单头部 -->
        <view class="order-header">
          <text class="order-no">{{ order.orderNo }}</text>
          <text class="tag" :class="getStatusTagClass(order.orderStatus)">
            {{ ORDER_STATUS_LABELS[order.orderStatus] }}
          </text>
        </view>

        <!-- 订单信息 -->
        <view class="order-body">
          <view class="order-info-row">
            <text class="info-label">款号:</text>
            <text class="info-value">{{ order.styleNo }}</text>
            <text class="info-label" style="margin-left: 20rpx;">数量:</text>
            <text class="info-value">{{ order.totalQty }}件</text>
          </view>
          <view class="order-info-row" v-if="order.styleName">
            <text class="info-label">款式:</text>
            <text class="info-value">{{ order.styleName }}</text>
          </view>
          <view class="order-info-row">
            <text class="info-label">客户:</text>
            <text class="info-value">{{ order.customer?.customerName || '-' }}</text>
          </view>
          <view class="order-info-row">
            <text class="info-label">工厂:</text>
            <text class="info-value">{{ order.assignedFactory?.factoryName || '未分配' }}</text>
          </view>
          <view class="order-info-row">
            <text class="info-label">交期:</text>
            <text class="info-value" :class="{ 'text-danger': isOverdue(order.deliveryDate) }">
              {{ formatDate(order.deliveryDate) }}
              <text v-if="isOverdue(order.deliveryDate)" class="overdue-tag">已逾期</text>
            </text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="orders.length === 0 && !loading" class="empty-state">
        <text class="empty-text">暂无订单</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading" class="loading-more">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-if="noMore && orders.length > 0" class="loading-more">
        <text class="loading-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { getOrders } from '../../api/orders';
import { ORDER_STATUS_LABELS } from '../../types';
import type { OrderListItem, OrderStatus } from '../../types';

const userStore = useUserStore();
const orders = ref<OrderListItem[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const currentPage = ref(1);
const pageSize = 20;
const currentStatus = ref<string>('');

const statusTabs = [
  { label: '全部', value: '' },
  { label: '已确认', value: 'confirmed' },
  { label: '生产中', value: 'in_progress' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
];

/** 加载订单列表 */
async function loadOrders(reset = false) {
  if (loading.value) return;
  if (reset) {
    currentPage.value = 1;
    noMore.value = false;
  }
  if (noMore.value) return;

  loading.value = true;
  try {
    const result = await getOrders({
      page: currentPage.value,
      pageSize,
      status: currentStatus.value || undefined,
    });
    if (reset) {
      orders.value = result.list;
    } else {
      orders.value.push(...result.list);
    }
    if (result.list.length < pageSize) {
      noMore.value = true;
    }
  } catch (err: any) {
    console.error('加载订单失败:', err.message);
  } finally {
    loading.value = false;
  }
}

/** 切换状态筛选 */
function switchStatus(status: string) {
  currentStatus.value = status;
  loadOrders(true);
}

/** 下拉刷新 */
async function onRefresh() {
  refreshing.value = true;
  await loadOrders(true);
  refreshing.value = false;
}

/** 上拉加载更多 */
function onLoadMore() {
  if (!noMore.value && !loading.value) {
    currentPage.value++;
    loadOrders();
  }
}

/** 跳转详情 */
function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/order-detail/index?id=${id}` });
}

/** 跳转创建订单 */
function goCreate() {
  uni.navigateTo({ url: '/pages/order-create/index' });
}

/** 登出 */
function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
      }
    },
  });
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 判断是否逾期 */
function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() ;
}

/** 状态标签样式 */
function getStatusTagClass(status: OrderStatus): string {
  const map: Record<string, string> = {
    draft: 'tag-gray',
    confirmed: 'tag-blue',
    in_progress: 'tag-amber',
    shipped: 'tag-amber',
    completed: 'tag-green',
    cancelled: 'tag-gray',
  };
  return map[status] || 'tag-gray';
}

onShow(() => {
  // 页面显示时刷新列表（从详情页返回时也能看到最新状态）
  loadOrders(true);
});
</script>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #e0e0e0;
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #2C2C2A;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.create-btn {
  font-size: 26rpx;
  color: #185FA5;
  padding: 8rpx 20rpx;
  border: 1rpx solid #185FA5;
  border-radius: 8rpx;
}

.header-right > view {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.user-name {
  font-size: 26rpx;
  color: #5F5E5A;
}

.status-tabs {
  display: flex;
  white-space: nowrap;
  background: #ffffff;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.tab-item {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 12rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #5F5E5A;
  background: #F1EFE8;
}

.tab-item.active {
  background: #185FA5;
  color: #ffffff;
}

.order-list {
  flex: 1;
  padding: 20rpx;
}

.order-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid #f0f0f0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-no {
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2A;
}

.order-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.order-info-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
}

.info-label {
  color: #888780;
  min-width: 80rpx;
}

.info-value {
  color: #333333;
  flex: 1;
}

.overdue-tag {
  display: inline-block;
  background: #FCEBEB;
  color: #A32D2D;
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  margin-left: 10rpx;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #B4B2A9;
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 30rpx 0;
}

.loading-text {
  font-size: 24rpx;
  color: #B4B2A9;
}

.text-danger {
  color: #A32D2D;
}

.tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.tag-blue { background: #E6F1FB; color: #185FA5; }
.tag-green { background: #E1F5EE; color: #0F6E56; }
.tag-red { background: #FCEBEB; color: #A32D2D; }
.tag-amber { background: #FAEEDA; color: #854F0B; }
.tag-gray { background: #F1EFE8; color: #5F5E5A; }
</style>
