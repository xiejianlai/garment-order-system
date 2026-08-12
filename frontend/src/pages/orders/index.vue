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
        <view v-if="userStore.isManager" class="create-btn" @tap="goCreate"><text>+ 新建</text></view>
        <view class="refresh-btn" @tap="forceRefresh"><text>刷新</text></view>
        <view @tap="handleLogout">
          <text class="user-name">{{ userStore.userInfo?.realName }}</text>
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

    <!-- 调试信息栏 (可见) -->
    <view class="debug-bar">
      <text class="debug-text">状态: {{ debugStatus }} | 数量: {{ orders.length }}</text>
    </view>

    <!-- 订单列表 — 使用明确高度而非flex:1 -->
    <scroll-view
      scroll-y
      class="order-list"
      :style="{ height: scrollHeight }"
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
            {{ ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus }}
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
            <text class="info-value">{{ order.customer?.customerName || order.customerName || '-' }}</text>
          </view>
          <view class="order-info-row">
            <text class="info-label">工厂:</text>
            <text class="info-value">{{ order.assignedFactory?.factoryName || order.factoryName || '未分配' }}</text>
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
      <view v-if="orders.length === 0 && !loading && !loadError" class="empty-state">
        <text class="empty-text">暂无订单，点击右上角"刷新"重试</text>
      </view>

      <!-- 错误状态 -->
      <view v-if="loadError && orders.length === 0" class="empty-state">
        <text class="empty-text">加载失败: {{ loadError }}</text>
        <view class="retry-btn" @tap="forceRefresh"><text>点击重试</text></view>
      </view>

      <!-- 加载中 -->
      <view v-if="loading" class="loading-more">
        <text class="loading-text">加载中...请稍候</text>
      </view>
      <view v-if="noMore && orders.length > 0" class="loading-more">
        <text class="loading-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { getOrders } from '../../api/orders';
import { ORDER_STATUS_LABELS } from '../../types';
import type { OrderListItem, OrderStatus } from '../../types';
import { getToken } from '../../utils/auth';

const userStore = useUserStore();
const orders = ref<OrderListItem[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const currentPage = ref(1);
const pageLimit = 20;
const currentStatus = ref<string>('');
const loadError = ref('');
const debugStatus = ref('初始化');
const requestSeq = ref(0); // 请求序号，防止竞态
let hasLoaded = false; // 防止 onLoad + onShow 双重调用

// scroll-view 高度：100vh - header(60rpx) - tabs(60rpx) - debug(40rpx)
// 在小程序中 flex:1 对 scroll-view 不可靠，必须用明确高度
const scrollHeight = computed(() => {
  return 'calc(100vh - 180rpx)';
});

const statusTabs = [
  { label: '全部', value: '' },
  { label: '已确认', value: 'confirmed' },
  { label: '生产中', value: 'in_progress' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
];

/** 加载订单列表 — reset=true 时强制刷新，不受 loading guard 限制 */
async function loadOrders(reset = false) {
  // 前置检查：无 token 不发请求，直接跳登录
  const token = getToken();
  if (!token) {
    debugStatus.value = '无token，跳转登录';
    console.log('[Orders] 无token，跳转登录页');
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }

  // reset 时强制刷新：即使上一个请求还在进行，也发起新请求
  if (!reset && loading.value) return;
  if (!reset && noMore.value) return;

  if (reset) {
    currentPage.value = 1;
    noMore.value = false;
  }

  const seq = ++requestSeq.value;
  loading.value = true;
  loadError.value = '';
  debugStatus.value = '正在请求...';

  try {
    const params: any = {
      page: currentPage.value,
      limit: pageLimit,
    };
    if (currentStatus.value) {
      params.status = currentStatus.value;
    }

    console.log('[Orders] 发起请求:', params);
    const result = await getOrders(params);
    console.log('[Orders] 收到响应:', result);

    // 检查是否是最新请求（防止竞态）
    if (seq !== requestSeq.value) {
      console.log('[Orders] 丢弃过期响应');
      return;
    }

    const list = result.list || [];
    if (reset) {
      orders.value = list;
    } else {
      orders.value.push(...list);
    }
    if (list.length < pageLimit) {
      noMore.value = true;
    }

    debugStatus.value = `成功(${list.length}条)`;
    console.log('[Orders] 加载成功, 共', list.length, '条, 当前列表:', orders.value.length, '条');
  } catch (err: any) {
    console.error('[Orders] 加载失败:', err);
    if (seq === requestSeq.value) {
      loadError.value = err.message || '网络请求失败';
      debugStatus.value = '失败: ' + (err.message || '未知错误');
    }
  } finally {
    if (seq === requestSeq.value) {
      loading.value = false;
    }
  }
}

/** 强制刷新（用户手动点击） */
function forceRefresh() {
  console.log('[Orders] 手动刷新');
  loadOrders(true);
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
  return new Date(dateStr) < new Date();
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

/** 从创建页返回时强制刷新 */
function onOrderCreated() {
  console.log('[Orders] 收到 orderCreated 事件，刷新列表');
  loadOrders(true);
}

// 页面首次加载
onLoad(() => {
  console.log('[Orders] onLoad');
  hasLoaded = true;
  loadOrders(true);
});

// 页面每次显示（包括从其他页面返回）
// 首次加载时 onShow 会在 onLoad 之后立即触发，用 hasLoaded 标志跳过
onShow(() => {
  console.log('[Orders] onShow, hasLoaded =', hasLoaded);
  if (hasLoaded) {
    hasLoaded = false; // 重置，后续 onShow 正常触发
    return;
  }
  loadOrders(true);
});

onMounted(() => {
  console.log('[Orders] onMounted, 注册 orderCreated 事件');
  uni.$on('orderCreated', onOrderCreated);
});

onUnmounted(() => {
  uni.$off('orderCreated', onOrderCreated);
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
  padding: 16rpx 30rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #e0e0e0;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #2C2C2A;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.create-btn {
  font-size: 26rpx;
  color: #185FA5;
  padding: 8rpx 20rpx;
  border: 1rpx solid #185FA5;
  border-radius: 8rpx;
}

.refresh-btn {
  font-size: 26rpx;
  color: #fff;
  padding: 8rpx 20rpx;
  background: #185FA5;
  border-radius: 8rpx;
}

.user-name {
  font-size: 26rpx;
  color: #5F5E5A;
}

.status-tabs {
  display: flex;
  white-space: nowrap;
  background: #ffffff;
  padding: 12rpx 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.tab-item {
  display: inline-block;
  padding: 10rpx 28rpx;
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

.debug-bar {
  padding: 6rpx 20rpx;
  background: #FFF8E1;
  border-bottom: 1rpx solid #FFE082;
}

.debug-text {
  font-size: 22rpx;
  color: #854F0B;
}

.order-list {
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #B4B2A9;
}

.retry-btn {
  margin-top: 20rpx;
  padding: 12rpx 40rpx;
  background: #185FA5;
  color: #fff;
  border-radius: 8rpx;
  font-size: 26rpx;
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
