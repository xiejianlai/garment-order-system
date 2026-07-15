<!--
  订单详情页 — 小程序 + H5 双端

  包含 4 个 Tab:
  1. 基础信息: 订单信息 + 颜色尺码矩阵
  2. 辅料进度: 辅料清单 + 齐套状态
  3. T&A进度: 13个阶段状态
  4. 操作日志: 变更日志流

  权限控制:
  - admin/merchandiser: 可看到所有 Tab
  - factory: 可看基础信息、T&A(可更新大货节点)、辅料(只读)
  - customer: 可看基础信息、T&A(只读)
-->
<template>
  <view class="detail-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <template v-else-if="order">
      <!-- 订单概要 -->
      <view class="order-summary card">
        <view class="summary-header">
          <text class="order-no">{{ order.orderNo }}</text>
          <text class="tag" :class="getStatusTagClass(order.orderStatus)">
            {{ ORDER_STATUS_LABELS[order.orderStatus] }}
          </text>
        </view>
        <view class="summary-row">
          <text class="summary-label">款号:</text>
          <text class="summary-value">{{ order.styleNo }}</text>
          <text class="summary-label" style="margin-left: 30rpx;">总数量:</text>
          <text class="summary-value">{{ order.totalQty }}件</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">交期:</text>
          <text class="summary-value" :class="{ 'text-danger': isOverdue }">
            {{ formatDate(order.deliveryDate) }}
          </text>
        </view>

        <!-- 辅料齐套 & T&A 进度速览 -->
        <view class="summary-badges">
          <view class="badge" :class="order.trimsSummary.allReady ? 'badge-green' : 'badge-amber'">
            <text>辅料齐套 {{ order.trimsSummary.ready }}/{{ order.trimsSummary.total }}</text>
          </view>
          <view class="badge" :class="order.taSummary.delayed > 0 ? 'badge-red' : 'badge-blue'">
            <text>T&A进度 {{ order.taSummary.completed }}/{{ order.taSummary.total }}</text>
          </view>
          <view v-if="order.taSummary.delayed > 0" class="badge badge-red">
            <text>延误 {{ order.taSummary.delayed }}项</text>
          </view>
        </view>
      </view>

      <!-- Tab 切换 -->
      <view class="tabs">
        <view
          v-for="tab in visibleTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @tap="activeTab = tab.key"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <!-- Tab 内容区 -->
      <scroll-view scroll-y class="tab-content">
        <!-- ========== Tab 1: 基础信息 + 颜色尺码矩阵 ========== -->
        <view v-if="activeTab === 'info'" class="tab-panel">
          <view class="card">
            <view class="card-title">订单信息</view>
            <view class="info-row">
              <text class="info-label">订单号</text>
              <text class="info-value">{{ order.orderNo }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">客户</text>
              <text class="info-value">{{ order.customer?.customerName || '-' }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">款号</text>
              <text class="info-value">{{ order.styleNo }}</text>
            </view>
            <view class="info-row" v-if="order.styleName">
              <text class="info-label">款式</text>
              <text class="info-value">{{ order.styleName }}</text>
            </view>
            <view class="info-row" v-if="order.season">
              <text class="info-label">季节</text>
              <text class="info-value">{{ order.season }}</text>
            </view>
            <view class="info-row" v-if="order.category">
              <text class="info-label">品类</text>
              <text class="info-value">{{ order.category }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">总数量</text>
              <text class="info-value">{{ order.totalQty }}件</text>
            </view>
            <view class="info-row">
              <text class="info-label">交期</text>
              <text class="info-value">{{ formatDate(order.deliveryDate) }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">工厂</text>
              <text class="info-value">{{ order.assignedFactory?.factoryName || '未分配' }}</text>
            </view>
            <view class="info-row" v-if="order.merchandiser">
              <text class="info-label">跟单员</text>
              <text class="info-value">{{ order.merchandiser.realName }}</text>
            </view>
            <view class="info-row" v-if="order.remark">
              <text class="info-label">备注</text>
              <text class="info-value">{{ order.remark }}</text>
            </view>
          </view>

          <!-- 颜色尺码矩阵 -->
          <view class="card">
            <view class="card-title">颜色尺码矩阵</view>
            <view class="matrix-table">
              <!-- 表头: 空格 + 尺码列 -->
              <view class="matrix-row matrix-header">
                <view class="matrix-cell matrix-color-header">颜色\尺码</view>
                <view
                  v-for="size in uniqueSizes"
                  :key="size"
                  class="matrix-cell matrix-size-header"
                >
                  {{ size }}
                </view>
                <view class="matrix-cell matrix-total-header">小计</view>
              </view>
              <!-- 数据行: 每个颜色一行 -->
              <view
                v-for="color in uniqueColors"
                :key="color"
                class="matrix-row"
              >
                <view class="matrix-cell matrix-color-cell">{{ color }}</view>
                <view
                  v-for="size in uniqueSizes"
                  :key="size"
                  class="matrix-cell"
                >
                  {{ getMatrixQty(color, size) || '-' }}
                </view>
                <view class="matrix-cell matrix-total-cell">{{ getColorTotal(color) }}</view>
              </view>
              <!-- 合计行 -->
              <view class="matrix-row matrix-footer">
                <view class="matrix-cell matrix-color-cell">合计</view>
                <view
                  v-for="size in uniqueSizes"
                  :key="size"
                  class="matrix-cell"
                >
                  {{ getSizeTotal(size) }}
                </view>
                <view class="matrix-cell matrix-total-cell">{{ order.totalQty }}</view>
              </view>
            </view>
          </view>
        </view>

        <!-- ========== Tab 2: 辅料进度 ========== -->
        <view v-if="activeTab === 'trims'" class="tab-panel">
          <!-- 齐套状态卡片 -->
          <view class="card">
            <view class="card-title-row">
              <text class="card-title-inline">辅料齐套状态</text>
              <text
                v-if="userStore.isAdmin"
                class="trim-manage-btn"
                @tap="goTrimManage"
              >管理辅料</text>
            </view>
            <view class="trims-ready-banner" :class="order.trimsSummary.allReady ? 'banner-green' : 'banner-amber'">
              <text class="banner-text">
                {{ order.trimsSummary.allReady ? '✓ 全部辅料已齐套' : `辅料齐套中 ${order.trimsSummary.ready}/${order.trimsSummary.total}` }}
              </text>
              <text
                v-if="userStore.isAdmin"
                class="banner-action"
                @tap="handleCheckTrimsReady"
              >刷新检查</text>
            </view>
          </view>

          <!-- 辅料列表 -->
          <view
            v-for="trim in order.trims"
            :key="trim.id"
            class="card"
          >
            <view class="trim-header">
              <text class="trim-name">{{ trim.trimName }}</text>
              <text class="tag" :class="trim.isReady ? 'tag-green' : 'tag-amber'">
                {{ trim.isReady ? '已齐套' : '未齐套' }}
              </text>
            </view>

            <view class="trim-info">
              <view class="info-row">
                <text class="info-label">规格</text>
                <text class="info-value">{{ trim.specification || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">用量</text>
                <text class="info-value">{{ trim.usagePerPiece }} {{ trim.unit }}/件 × {{ order.totalQty }}件 = {{ trim.totalDemand }} {{ trim.unit }}</text>
              </view>
              <view class="info-row" v-if="trim.supplier">
                <text class="info-label">供应商</text>
                <text class="info-value">{{ trim.supplier.factoryName }}</text>
              </view>
            </view>

            <!-- 打样阶段 -->
            <view class="trim-section">
              <text class="section-title">打样阶段</text>
              <view class="trim-steps">
                <view class="step" :class="getSamplingStepClass(trim.samplingStatus)">
                  <text>待处理</text>
                </view>
                <view class="step-arrow">→</view>
                <view class="step" :class="['in_sampling','sent_for_approval','approved','rejected'].includes(trim.samplingStatus) ? 'step-active' : ''">
                  <text>打样中</text>
                </view>
                <view class="step-arrow">→</view>
                <view class="step" :class="['sent_for_approval','approved'].includes(trim.samplingStatus) ? 'step-active' : ''">
                  <text>寄客批</text>
                </view>
                <view class="step-arrow">→</view>
                <view class="step" :class="trim.samplingStatus === 'approved' ? 'step-done' : ''">
                  <text>已确认</text>
                </view>
              </view>
            </view>

            <!-- 大货阶段 -->
            <view class="trim-section">
              <text class="section-title">大货阶段</text>
              <view class="trim-steps">
                <view class="step" :class="['ordered','producing','shipped','received'].includes(trim.bulkPoStatus) ? 'step-active' : ''">
                  <text>已下单</text>
                </view>
                <view class="step-arrow">→</view>
                <view class="step" :class="trim.bulkEtd ? 'step-active' : ''">
                  <text>预计到厂 {{ trim.bulkEtd ? formatDate(trim.bulkEtd) : '-' }}</text>
                </view>
                <view class="step-arrow">→</view>
                <view class="step" :class="trim.bulkEta ? 'step-active' : ''">
                  <text>实际到厂 {{ trim.bulkEta ? formatDate(trim.bulkEta) : '-' }}</text>
                </view>
                <view class="step-arrow">→</view>
                <view class="step" :class="trim.qtyCheckStatus === 'sufficient' ? 'step-done' : trim.qtyCheckStatus === 'short' ? 'step-fail' : ''">
                  <text>清点: {{ TRIM_BULK_LABELS_QTY[trim.qtyCheckStatus] || '待清点' }}</text>
                </view>
              </view>
              <view class="trim-steps" style="margin-top: 12rpx;">
                <view class="step" :class="trim.inspectionResult === 'pass' ? 'step-done' : trim.inspectionResult === 'fail' ? 'step-fail' : ''">
                  <text>检验: {{ TRIM_INSPECTION_LABELS[trim.inspectionResult] || '待检验' }}</text>
                </view>
              </view>
            </view>
          </view>

          <view v-if="order.trims.length === 0" class="empty-text">暂无辅料记录</view>
        </view>

        <!-- ========== Tab 3: T&A 生产进度 ========== -->
        <view v-if="activeTab === 'ta'" class="tab-panel">
          <view
            v-for="category in taCategories"
            :key="category.key"
            class="card"
          >
            <view class="card-title">{{ category.label }}</view>
            <view
              v-for="stage in getStagesByCategory(category.key)"
              :key="stage.id"
              class="ta-stage-row"
            >
              <view class="ta-stage-left">
                <view class="ta-status-dot" :class="'dot-' + stage.status"></view>
                <view class="ta-stage-info">
                  <text class="ta-stage-name">{{ stage.stageName }}</text>
                  <text class="ta-stage-dates">
                    <text v-if="stage.plannedDate">计划: {{ formatDate(stage.plannedDate) }}</text>
                    <text v-if="stage.actualDate"> | 实际: {{ formatDate(stage.actualDate) }}</text>
                    <text v-if="stage.completionPct > 0"> | {{ stage.completionPct }}%</text>
                  </text>
                  <text v-if="stage.remark" class="ta-stage-remark">{{ stage.remark }}</text>
                </view>
              </view>
              <view class="ta-stage-right">
                <text class="tag" :class="STATUS_COLORS[stage.status]">
                  {{ STATUS_LABELS[stage.status] }}
                </text>
                <!-- 工厂端可更新大货生产阶段 -->
                <text
                  v-if="canUpdateStage(stage) && userStore.isFactory"
                  class="ta-update-btn"
                  @tap="showStageUpdate(stage)"
                >更新</text>
                <!-- 管理端可更新所有阶段 -->
                <text
                  v-if="userStore.isAdmin"
                  class="ta-update-btn"
                  @tap="showStageUpdate(stage)"
                >更新</text>
              </view>
            </view>
          </view>
        </view>

        <!-- ========== Tab 4: 操作日志 ========== -->
        <view v-if="activeTab === 'logs'" class="tab-panel">
          <view class="card">
            <view class="card-title">操作日志流</view>
            <view v-if="order.logs.length === 0" class="empty-text">暂无操作记录</view>
            <view v-for="log in order.logs" :key="log.id" class="log-item">
              <view class="log-time">{{ formatDateTime(log.createdAt) }}</view>
              <view class="log-content">
                <text class="log-user">{{ log.userName }} ({{ ROLE_LABELS[log.userRole] }})</text>
                <text class="log-summary">{{ log.changeSummary }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { getOrderDetail, updateTaStage, checkTrimsReady } from '../../api/orders';
import { subscribeOrderLogs, unsubscribeOrderLogs } from '../../utils/realtime';
import {
  ORDER_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  TA_CATEGORY_LABELS,
  ROLE_LABELS,
} from '../../types';
import type { OrderDetail, OrderTaStage, OrderStatus } from '../../types';

const userStore = useUserStore();
const order = ref<OrderDetail | null>(null);
const loading = ref(true);
const activeTab = ref('info');
const orderId = ref(0);

/** 可见 Tab（按角色过滤） */
const visibleTabs = computed(() => {
  const tabs = [
    { key: 'info', label: '基础信息' },
    { key: 'trims', label: '辅料进度' },
    { key: 'ta', label: 'T&A进度' },
    { key: 'logs', label: '操作日志' },
  ];
  // 客户端不显示操作日志
  if (userStore.isCustomer) {
    return tabs.filter((t) => t.key !== 'logs');
  }
  // 工厂端不显示操作日志
  if (userStore.isFactory) {
    return tabs.filter((t) => t.key !== 'logs');
  }
  return tabs;
});

/** T&A 分类 */
const taCategories = [
  { key: 'sampling', label: '打样阶段' },
  { key: 'production', label: '大货生产' },
  { key: 'inspection', label: '验货阶段' },
  { key: 'shipping', label: '出货阶段' },
];

/** 辅料状态映射 */
const TRIM_BULK_LABELS_QTY: Record<string, string> = {
  pending: '待清点',
  short: '短缺',
  sufficient: '足额',
};
const TRIM_INSPECTION_LABELS: Record<string, string> = {
  pending: '待检验',
  pass: '合格',
  fail: '不合格',
};

/** 计算属性: 唯一颜色和尺码列表 */
const uniqueColors = computed(() => {
  if (!order.value) return [];
  return [...new Set(order.value.colorSizes.map((cs) => cs.color))];
});
const uniqueSizes = computed(() => {
  if (!order.value) return [];
  return [...new Set(order.value.colorSizes.map((cs) => cs.size))];
});

const isOverdue = computed(() => {
  if (!order.value) return false;
  return new Date(order.value.deliveryDate) < new Date() && order.value.orderStatus !== 'completed';
});

/** 加载订单详情 */
async function loadOrderDetail() {
  loading.value = true;
  try {
    order.value = await getOrderDetail(orderId.value);
  } catch (err: any) {
    uni.showToast({ title: '加载失败: ' + err.message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

/** 矩阵工具函数 */
function getMatrixQty(color: string, size: string): number {
  const item = order.value?.colorSizes.find((cs) => cs.color === color && cs.size === size);
  return item?.quantity || 0;
}
function getColorTotal(color: string): number {
  return order.value?.colorSizes.filter((cs) => cs.color === color).reduce((sum, cs) => sum + cs.quantity, 0) || 0;
}
function getSizeTotal(size: string): number {
  return order.value?.colorSizes.filter((cs) => cs.size === size).reduce((sum, cs) => sum + cs.quantity, 0) || 0;
}

/** T&A 工具函数 */
function getStagesByCategory(category: string): OrderTaStage[] {
  return order.value?.taStages.filter((s) => s.stageCategory === category) || [];
}
function canUpdateStage(stage: OrderTaStage): boolean {
  // 工厂端只能更新大货生产阶段
  if (userStore.isFactory) {
    return stage.stageCategory === 'production';
  }
  return userStore.isAdmin;
}

/** 显示阶段更新弹窗 */
function showStageUpdate(stage: OrderTaStage) {
  const statuses = ['not_started', 'in_progress', 'completed', 'delayed'];
  uni.showActionSheet({
    itemList: statuses.map((s) => STATUS_LABELS[s]),
    success: async (res) => {
      const newStatus = statuses[res.tapIndex];
      try {
        await updateTaStage(orderId.value, stage.stageCode, { status: newStatus });
        uni.showToast({ title: '更新成功', icon: 'success' });
        await loadOrderDetail(); // 刷新详情
      } catch (err: any) {
        uni.showToast({ title: '更新失败', icon: 'none' });
      }
    },
  });
}

/** 一键检查辅料齐套 */
async function handleCheckTrimsReady() {
  try {
    const result = await checkTrimsReady(orderId.value);
    if (result.allReady) {
      uni.showToast({ title: '所有辅料已齐套', icon: 'success' });
    } else {
      const notReady = result.notReadyItems.map((i) => `${i.trimName}: ${i.missingSteps.join(',')}`).join('\n');
      uni.showModal({ title: '辅料未齐套', content: notReady, showCancel: false });
    }
    await loadOrderDetail();
  } catch (err: any) {
    uni.showToast({ title: '检查失败', icon: 'none' });
  }
}

/** 跳转辅料管理页 */
function goTrimManage() {
  uni.navigateTo({ url: `/pages/trim-manage/index?orderId=${orderId.value}` });
}

/** 工具函数 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function getStatusTagClass(status: OrderStatus): string {
  const map: Record<string, string> = {
    draft: 'tag-gray', confirmed: 'tag-blue', in_progress: 'tag-amber',
    shipped: 'tag-amber', completed: 'tag-green', cancelled: 'tag-gray',
  };
  return map[status] || 'tag-gray';
}
function getSamplingStepClass(status: string): string {
  if (['in_sampling', 'sent_for_approval', 'approved', 'rejected'].includes(status)) return 'step-active';
  if (status === 'pending') return 'step-active';
  return '';
}

onLoad((options: any) => {
  orderId.value = Number(options.id);
  loadOrderDetail();
});

/** 实时日志推送 — 订阅订单操作日志 */
onMounted(() => {
  if (orderId.value) {
    subscribeOrderLogs(orderId.value, (newLogs) => {
      if (order.value) {
        // 将新日志插入到日志列表头部（最新的在前）
        order.value.logs = [...newLogs, ...order.value.logs];
      }
    });
  }
});

onUnmounted(() => {
  unsubscribeOrderLogs();
});
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
  color: #B4B2A9;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #2C2C2A;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.card-title-inline {
  font-size: 28rpx;
  font-weight: 600;
  color: #2C2C2A;
}
.trim-manage-btn {
  font-size: 24rpx;
  color: #185FA5;
  padding: 6rpx 16rpx;
  border: 1rpx solid #185FA5;
  border-radius: 8rpx;
}

/* 订单概要 */
.order-summary .summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.order-no { font-size: 32rpx; font-weight: 600; color: #2C2C2A; }
.summary-row { display: flex; align-items: center; margin-bottom: 12rpx; font-size: 26rpx; }
.summary-label { color: #888780; min-width: 80rpx; }
.summary-value { color: #333333; }
.summary-badges { display: flex; gap: 12rpx; margin-top: 16rpx; flex-wrap: wrap; }
.badge { padding: 8rpx 20rpx; border-radius: 8rpx; font-size: 24rpx; }
.badge-green { background: #E1F5EE; color: #0F6E56; }
.badge-amber { background: #FAEEDA; color: #854F0B; }
.badge-red { background: #FCEBEB; color: #A32D2D; }
.badge-blue { background: #E6F1FB; color: #185FA5; }

/* Tab */
.tabs {
  display: flex;
  background: #ffffff;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #e0e0e0;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #5F5E5A;
  position: relative;
}
.tab-item.active {
  color: #185FA5;
  font-weight: 600;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  right: 25%;
  height: 4rpx;
  background: #185FA5;
  border-radius: 2rpx;
}

.tab-content { flex: 1; }

/* 信息行 */
.info-row { display: flex; padding: 10rpx 0; font-size: 26rpx; }
.info-label { color: #888780; min-width: 140rpx; }
.info-value { color: #333333; flex: 1; }

/* 颜色尺码矩阵 */
.matrix-table { border: 1rpx solid #e0e0e0; border-radius: 8rpx; overflow: hidden; }
.matrix-row { display: flex; border-bottom: 1rpx solid #f0f0f0; }
.matrix-row:last-child { border-bottom: none; }
.matrix-cell {
  flex: 1;
  text-align: center;
  padding: 16rpx 8rpx;
  font-size: 24rpx;
  border-right: 1rpx solid #f0f0f0;
  min-height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.matrix-cell:last-child { border-right: none; }
.matrix-header { background: #F1EFE8; }
.matrix-color-header { font-weight: 600; color: #5F5E5A; min-width: 120rpx; flex: 1.2; }
.matrix-size-header { font-weight: 600; color: #5F5E5A; }
.matrix-total-header { font-weight: 600; color: #5F5E5A; background: #E1F5EE; }
.matrix-color-cell { font-weight: 500; color: #2C2C2A; min-width: 120rpx; flex: 1.2; }
.matrix-total-cell { background: #E1F5EE; font-weight: 600; color: #0F6E56; }
.matrix-footer { background: #F1EFE8; }
.matrix-footer .matrix-cell { font-weight: 600; }

/* 辅料 */
.trim-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.trim-name { font-size: 28rpx; font-weight: 600; color: #2C2C2A; }
.trim-info { margin-bottom: 16rpx; }
.trim-section { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.section-title { font-size: 24rpx; color: #5F5E5A; margin-bottom: 12rpx; display: block; }
.trim-steps { display: flex; align-items: center; flex-wrap: wrap; gap: 8rpx; }
.step {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  background: #F1EFE8;
  color: #888780;
}
.step-active { background: #E6F1FB; color: #185FA5; }
.step-done { background: #E1F5EE; color: #0F6E56; }
.step-fail { background: #FCEBEB; color: #A32D2D; }
.step-arrow { color: #B4B2A9; font-size: 20rpx; }
.trims-ready-banner { display: flex; justify-content: space-between; align-items: center; padding: 20rpx; border-radius: 12rpx; }
.banner-green { background: #E1F5EE; }
.banner-amber { background: #FAEEDA; }
.banner-text { font-size: 26rpx; font-weight: 500; }
.banner-action { font-size: 24rpx; color: #185FA5; padding: 8rpx 16rpx; background: #ffffff; border-radius: 8rpx; }

/* T&A */
.ta-stage-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.ta-stage-row:last-child { border-bottom: none; }
.ta-stage-left { display: flex; align-items: flex-start; gap: 16rpx; flex: 1; }
.ta-status-dot { width: 20rpx; height: 20rpx; border-radius: 50%; margin-top: 8rpx; flex-shrink: 0; }
.dot-not_started { background: #B4B2A9; }
.dot-in_progress { background: #378ADD; }
.dot-completed { background: #1D9E75; }
.dot-delayed { background: #E24B4A; }
.ta-stage-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.ta-stage-name { font-size: 28rpx; color: #2C2C2A; font-weight: 500; }
.ta-stage-dates { font-size: 22rpx; color: #888780; }
.ta-stage-remark { font-size: 22rpx; color: #854F0B; }
.ta-stage-right { display: flex; align-items: center; gap: 12rpx; }
.ta-update-btn { font-size: 24rpx; color: #185FA5; padding: 8rpx 16rpx; border: 1rpx solid #185FA5; border-radius: 8rpx; }

/* 日志 */
.log-item { padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.log-item:last-child { border-bottom: none; }
.log-time { font-size: 22rpx; color: #888780; margin-bottom: 8rpx; }
.log-content { display: flex; flex-direction: column; gap: 4rpx; }
.log-user { font-size: 26rpx; color: #185FA5; font-weight: 500; }
.log-summary { font-size: 26rpx; color: #333333; }

/* 通用 */
.empty-text { text-align: center; padding: 40rpx; color: #B4B2A9; font-size: 26rpx; }
.text-danger { color: #A32D2D; }
.tag { display: inline-block; padding: 4rpx 16rpx; border-radius: 8rpx; font-size: 22rpx; }
.tag-blue { background: #E6F1FB; color: #185FA5; }
.tag-green { background: #E1F5EE; color: #0F6E56; }
.tag-red { background: #FCEBEB; color: #A32D2D; }
.tag-amber { background: #FAEEDA; color: #854F0B; }
.tag-gray { background: #F1EFE8; color: #5F5E5A; }
</style>
