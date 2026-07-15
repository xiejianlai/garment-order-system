<!--
  辅料管理页 — 小程序 + H5 双端

  功能:
  1. 查看订单所有辅料列表
  2. 新增辅料（admin/merchandiser）
  3. 更新辅料打样/大货进度状态
  4. 齐套状态可视化
  5. 删除辅料

  权限: admin/merchandiser 可增删改, factory 只读
-->
<template>
  <view class="trim-manage-page">
    <!-- 顶部齐套概览 -->
    <view class="ready-summary card">
      <view class="ready-info">
        <text class="ready-title">辅料齐套状态</text>
        <view class="ready-bar">
          <view class="ready-bar-fill" :class="allReady ? 'fill-green' : 'fill-amber'" :style="{ width: readyPercent + '%' }"></view>
        </view>
        <text class="ready-text">
          {{ allReady ? '全部辅料已齐套' : `齐套中 ${readyCount}/${totalCount}` }}
        </text>
      </view>
      <text class="check-btn" @tap="handleCheckReady">刷新检查</text>
    </view>

    <!-- 辅料列表 -->
    <view
      v-for="trim in trims"
      :key="trim.id"
      class="trim-card card"
    >
      <!-- 辅料头部 -->
      <view class="trim-header">
        <view class="trim-header-left">
          <text class="trim-name">{{ trim.trimName }}</text>
          <text class="trim-category tag tag-blue">{{ TRIM_CATEGORY_LABELS[trim.trimCategory] || trim.trimCategory }}</text>
        </view>
        <text class="tag" :class="trim.isReady ? 'tag-green' : 'tag-amber'">
          {{ trim.isReady ? '已齐套' : '未齐套' }}
        </text>
      </view>

      <!-- 辅料基本信息 -->
      <view class="trim-info">
        <view class="info-row">
          <text class="info-label">规格</text>
          <text class="info-value">{{ trim.specification || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">用量</text>
          <text class="info-value">{{ trim.usagePerPiece }} {{ trim.unit }}/件</text>
        </view>
        <view class="info-row">
          <text class="info-label">总需求</text>
          <text class="info-value text-bold">{{ trim.totalDemand }} {{ trim.unit }}</text>
        </view>
        <view class="info-row" v-if="trim.supplier">
          <text class="info-label">供应商</text>
          <text class="info-value">{{ trim.supplier.factoryName }}</text>
        </view>
        <view class="info-row" v-if="trim.remark">
          <text class="info-label">备注</text>
          <text class="info-value">{{ trim.remark }}</text>
        </view>
      </view>

      <!-- 打样阶段 -->
      <view class="trim-section">
        <view class="section-header">
          <text class="section-title">打样阶段</text>
          <text
            v-if="canEdit"
            class="edit-btn"
            @tap="openSamplingUpdate(trim)"
          >更新</text>
        </view>
        <view class="status-steps">
          <view class="status-step" :class="getSamplingStepClass(trim.samplingStatus, 'pending')">待处理</view>
          <view class="step-line" :class="{ 'line-active': ['in_sampling','sent_for_approval','approved','rejected'].includes(trim.samplingStatus) }"></view>
          <view class="status-step" :class="getSamplingStepClass(trim.samplingStatus, 'in_sampling')">打样中</view>
          <view class="step-line" :class="{ 'line-active': ['sent_for_approval','approved'].includes(trim.samplingStatus) }"></view>
          <view class="status-step" :class="getSamplingStepClass(trim.samplingStatus, 'sent_for_approval')">寄客批</view>
          <view class="step-line" :class="{ 'line-active': trim.samplingStatus === 'approved' }"></view>
          <view class="status-step" :class="getSamplingStepClass(trim.samplingStatus, 'approved')">已确认</view>
        </view>
        <view class="dates-row" v-if="trim.samplingSentDate || trim.samplingApprovedDate">
          <text v-if="trim.samplingSentDate" class="date-text">寄出: {{ formatDate(trim.samplingSentDate) }}</text>
          <text v-if="trim.samplingApprovedDate" class="date-text">确认: {{ formatDate(trim.samplingApprovedDate) }}</text>
        </view>
        <view class="remark-text" v-if="trim.samplingRemark">{{ trim.samplingRemark }}</view>
      </view>

      <!-- 大货阶段 -->
      <view class="trim-section">
        <view class="section-header">
          <text class="section-title">大货阶段</text>
          <text
            v-if="canEdit"
            class="edit-btn"
            @tap="openBulkUpdate(trim)"
          >更新</text>
        </view>
        <view class="status-steps">
          <view class="status-step" :class="getBulkStepClass(trim.bulkPoStatus, 'not_ordered')">未下单</view>
          <view class="step-line" :class="{ 'line-active': ['ordered','producing','shipped','received'].includes(trim.bulkPoStatus) }"></view>
          <view class="status-step" :class="getBulkStepClass(trim.bulkPoStatus, 'ordered')">已下单</view>
          <view class="step-line" :class="{ 'line-active': ['producing','shipped','received'].includes(trim.bulkPoStatus) }"></view>
          <view class="status-step" :class="getBulkStepClass(trim.bulkPoStatus, 'producing')">生产中</view>
          <view class="step-line" :class="{ 'line-active': ['shipped','received'].includes(trim.bulkPoStatus) }"></view>
          <view class="status-step" :class="getBulkStepClass(trim.bulkPoStatus, 'shipped')">已发货</view>
          <view class="step-line" :class="{ 'line-active': trim.bulkPoStatus === 'received' }"></view>
          <view class="status-step" :class="getBulkStepClass(trim.bulkPoStatus, 'received')">已到厂</view>
        </view>

        <!-- 大货详情 -->
        <view class="bulk-detail" v-if="trim.bulkPoNo || trim.bulkEtd || trim.bulkEta || trim.receivedQty">
          <view class="info-row" v-if="trim.bulkPoNo">
            <text class="info-label">PO号</text>
            <text class="info-value">{{ trim.bulkPoNo }}</text>
          </view>
          <view class="info-row" v-if="trim.bulkPoDate">
            <text class="info-label">下单日期</text>
            <text class="info-value">{{ formatDate(trim.bulkPoDate) }}</text>
          </view>
          <view class="info-row" v-if="trim.bulkEtd">
            <text class="info-label">预计到厂</text>
            <text class="info-value">{{ formatDate(trim.bulkEtd) }}</text>
          </view>
          <view class="info-row" v-if="trim.bulkEta">
            <text class="info-label">实际到厂</text>
            <text class="info-value">{{ formatDate(trim.bulkEta) }}</text>
          </view>
          <view class="info-row" v-if="trim.receivedQty !== null && trim.receivedQty !== undefined">
            <text class="info-label">到厂数量</text>
            <text class="info-value">{{ trim.receivedQty }} / {{ trim.totalDemand }} {{ trim.unit }}</text>
          </view>
        </view>

        <!-- 清点 & 检验 -->
        <view class="check-row">
          <view class="check-item">
            <text class="check-label">数量清点</text>
            <text class="tag" :class="trim.qtyCheckStatus === 'sufficient' ? 'tag-green' : trim.qtyCheckStatus === 'short' ? 'tag-red' : 'tag-gray'">
              {{ TRIM_QTY_LABELS[trim.qtyCheckStatus] || '待清点' }}
            </text>
          </view>
          <view class="check-item">
            <text class="check-label">检验结果</text>
            <text class="tag" :class="trim.inspectionResult === 'pass' ? 'tag-green' : trim.inspectionResult === 'fail' ? 'tag-red' : 'tag-gray'">
              {{ TRIM_INSPECTION_LABELS[trim.inspectionResult] || '待检验' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="trims.length === 0" class="empty-state">
      <text class="empty-text">暂无辅料记录</text>
      <text v-if="canEdit" class="empty-action" @tap="openAddTrim">点击添加辅料</text>
    </view>

    <!-- 添加辅料按钮（浮动） -->
    <view v-if="canEdit" class="fab-btn" @tap="openAddTrim">
      <text class="fab-icon">+</text>
    </view>

    <!-- ========== 新增辅料弹窗 ========== -->
    <view v-if="showAddModal" class="modal-mask" @tap="showAddModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">新增辅料</text>
          <text class="modal-close" @tap="showAddModal = false">x</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label required">辅料名称</text>
            <input v-model="newTrim.trimName" class="form-input" placeholder="如: 主唛" placeholder-class="placeholder" />
          </view>
          <view class="form-item">
            <text class="form-label required">辅料类型</text>
            <picker mode="selector" :range="trimCategoryOptions" :range-key="'label'" @change="onCategoryChange">
              <view class="form-picker">
                <text :class="{ placeholder: !newTrim.trimCategory }">
                  {{ TRIM_CATEGORY_LABELS[newTrim.trimCategory] || '请选择类型' }}
                </text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">规格</text>
            <input v-model="newTrim.specification" class="form-input" placeholder="如: 2cm x 5cm" placeholder-class="placeholder" />
          </view>
          <view class="form-row">
            <view class="form-item half">
              <text class="form-label required">每件用量</text>
              <input v-model="newTrim.usagePerPiece" class="form-input" type="digit" placeholder="如: 1" placeholder-class="placeholder" />
            </view>
            <view class="form-item half">
              <text class="form-label">单位</text>
              <picker mode="selector" :range="units" @change="onUnitChange">
                <view class="form-picker">
                  <text>{{ newTrim.unit || 'pcs' }}</text>
                  <text class="picker-arrow">></text>
                </view>
              </picker>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">供应商</text>
            <picker mode="selector" :range="supplierOptions" :range-key="'factoryName'" @change="onSupplierChange">
              <view class="form-picker">
                <text :class="{ placeholder: !newTrim.supplierId }">
                  {{ selectedSupplierName || '请选择供应商（可选）' }}
                </text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <textarea v-model="newTrim.remark" class="form-textarea" placeholder="辅料备注..." placeholder-class="placeholder" />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @tap="showAddModal = false">取消</button>
          <button class="btn-submit" @tap="handleAddTrim">添加</button>
        </view>
      </view>
    </view>

    <!-- ========== 打样状态更新弹窗 ========== -->
    <view v-if="showSamplingModal" class="modal-mask" @tap="showSamplingModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">更新打样进度 - {{ editingTrim?.trimName }}</text>
          <text class="modal-close" @tap="showSamplingModal = false">x</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label required">打样状态</text>
            <picker mode="selector" :range="samplingStatusOptions" :range-key="'label'" @change="onSamplingStatusChange">
              <view class="form-picker">
                <text>{{ samplingStatusLabel || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item" v-if="['sent_for_approval','approved','rejected'].includes(samplingUpdate.samplingStatus)">
            <text class="form-label">寄出日期</text>
            <picker mode="date" :value="samplingUpdate.samplingSentDate" @change="(e: any) => samplingUpdate.samplingSentDate = e.detail.value">
              <view class="form-picker">
                <text :class="{ placeholder: !samplingUpdate.samplingSentDate }">{{ samplingUpdate.samplingSentDate || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item" v-if="samplingUpdate.samplingStatus === 'approved'">
            <text class="form-label">确认日期</text>
            <picker mode="date" :value="samplingUpdate.samplingApprovedDate" @change="(e: any) => samplingUpdate.samplingApprovedDate = e.detail.value">
              <view class="form-picker">
                <text :class="{ placeholder: !samplingUpdate.samplingApprovedDate }">{{ samplingUpdate.samplingApprovedDate || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <textarea v-model="samplingUpdate.samplingRemark" class="form-textarea" placeholder="打样备注..." placeholder-class="placeholder" />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @tap="showSamplingModal = false">取消</button>
          <button class="btn-submit" @tap="handleSamplingUpdate">保存</button>
        </view>
      </view>
    </view>

    <!-- ========== 大货状态更新弹窗 ========== -->
    <view v-if="showBulkModal" class="modal-mask" @tap="showBulkModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">更新大货进度 - {{ editingTrim?.trimName }}</text>
          <text class="modal-close" @tap="showBulkModal = false">x</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label required">大货状态</text>
            <picker mode="selector" :range="bulkStatusOptions" :range-key="'label'" @change="onBulkStatusChange">
              <view class="form-picker">
                <text>{{ bulkStatusLabel || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">PO号</text>
            <input v-model="bulkUpdate.bulkPoNo" class="form-input" placeholder="大货采购单号" placeholder-class="placeholder" />
          </view>
          <view class="form-row">
            <view class="form-item half">
              <text class="form-label">下单日期</text>
              <picker mode="date" :value="bulkUpdate.bulkPoDate" @change="(e: any) => bulkUpdate.bulkPoDate = e.detail.value">
                <view class="form-picker">
                  <text :class="{ placeholder: !bulkUpdate.bulkPoDate }">{{ bulkUpdate.bulkPoDate || '选择日期' }}</text>
                  <text class="picker-arrow">></text>
                </view>
              </picker>
            </view>
            <view class="form-item half">
              <text class="form-label">预计到厂</text>
              <picker mode="date" :value="bulkUpdate.bulkEtd" @change="(e: any) => bulkUpdate.bulkEtd = e.detail.value">
                <view class="form-picker">
                  <text :class="{ placeholder: !bulkUpdate.bulkEtd }">{{ bulkUpdate.bulkEtd || '选择日期' }}</text>
                  <text class="picker-arrow">></text>
                </view>
              </picker>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">实际到厂日期</text>
            <picker mode="date" :value="bulkUpdate.bulkEta" @change="(e: any) => bulkUpdate.bulkEta = e.detail.value">
              <view class="form-picker">
                <text :class="{ placeholder: !bulkUpdate.bulkEta }">{{ bulkUpdate.bulkEta || '选择日期' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">到厂数量</text>
            <input v-model="bulkUpdate.receivedQty" class="form-input" type="number" :placeholder="`应到: ${editingTrim?.totalDemand || 0}`" placeholder-class="placeholder" />
          </view>
          <view class="form-item">
            <text class="form-label">数量清点</text>
            <picker mode="selector" :range="qtyCheckOptions" :range-key="'label'" @change="onQtyCheckChange">
              <view class="form-picker">
                <text>{{ qtyCheckLabel || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">检验结果</text>
            <picker mode="selector" :range="inspectionOptions" :range-key="'label'" @change="onInspectionChange">
              <view class="form-picker">
                <text>{{ inspectionLabel || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">检验备注</text>
            <textarea v-model="bulkUpdate.inspectionNote" class="form-textarea" placeholder="检验说明..." placeholder-class="placeholder" />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @tap="showBulkModal = false">取消</button>
          <button class="btn-submit" @tap="handleBulkUpdate">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { http } from '../../utils/request';
import {
  TRIM_SAMPLING_LABELS,
  TRIM_BULK_LABELS,
} from '../../types';
import type { OrderTrim } from '../../types';

const userStore = useUserStore();
const canEdit = computed(() => userStore.isAdmin);
const orderId = ref(0);

// 辅料列表
const trims = ref<OrderTrim[]>([]);
const readyCount = computed(() => trims.value.filter((t) => t.isReady).length);
const totalCount = computed(() => trims.value.length);
const allReady = computed(() => totalCount.value > 0 && readyCount.value === totalCount.value);
const readyPercent = computed(() => totalCount.value > 0 ? Math.round((readyCount.value / totalCount.value) * 100) : 0);

// 供应商数据
const supplierOptions = ref<any[]>([]);

// 状态映射
const TRIM_CATEGORY_LABELS: Record<string, string> = {
  label: '唛头',
  zipper: '拉链',
  button: '纽扣',
  thread: '缝纫线',
  packaging: '包装',
  hangtag: '吊牌',
  other: '其他',
};
const TRIM_QTY_LABELS: Record<string, string> = {
  pending: '待清点',
  short: '短缺',
  sufficient: '足额',
};
const TRIM_INSPECTION_LABELS: Record<string, string> = {
  pending: '待检验',
  pass: '合格',
  fail: '不合格',
};

// 选项数据
const trimCategoryOptions = Object.entries(TRIM_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const units = ['pcs', 'set', 'm', 'cm', 'kg', 'g', 'roll'];
const samplingStatusOptions = Object.entries(TRIM_SAMPLING_LABELS).map(([value, label]) => ({ value, label }));
const bulkStatusOptions = Object.entries(TRIM_BULK_LABELS).map(([value, label]) => ({ value, label }));
const qtyCheckOptions = [
  { value: 'pending', label: '待清点' },
  { value: 'short', label: '短缺' },
  { value: 'sufficient', label: '足额' },
];
const inspectionOptions = [
  { value: 'pending', label: '待检验' },
  { value: 'pass', label: '合格' },
  { value: 'fail', label: '不合格' },
];

// 新增辅料弹窗
const showAddModal = ref(false);
const newTrim = ref({
  trimName: '',
  trimCategory: '',
  specification: '',
  usagePerPiece: '',
  unit: 'pcs',
  supplierId: 0,
  remark: '',
});
const selectedSupplierName = computed(() =>
  supplierOptions.value.find((s) => s.id === newTrim.value.supplierId)?.factoryName || '',
);

// 打样更新弹窗
const showSamplingModal = ref(false);
const editingTrim = ref<OrderTrim | null>(null);
const samplingUpdate = ref<any>({});
const samplingStatusLabel = computed(() =>
  TRIM_SAMPLING_LABELS[samplingUpdate.value.samplingStatus] || '',
);

// 大货更新弹窗
const showBulkModal = ref(false);
const bulkUpdate = ref<any>({});
const bulkStatusLabel = computed(() =>
  TRIM_BULK_LABELS[bulkUpdate.value.bulkPoStatus] || '',
);
const qtyCheckLabel = computed(() => {
  const opt = qtyCheckOptions.find((o) => o.value === bulkUpdate.value.qtyCheckStatus);
  return opt?.label || '';
});
const inspectionLabel = computed(() => {
  const opt = inspectionOptions.find((o) => o.value === bulkUpdate.value.inspectionResult);
  return opt?.label || '';
});

/** 加载辅料列表 */
async function loadTrims() {
  try {
    const detail = await http.get(`/orders/${orderId.value}`);
    trims.value = detail.trims || [];
  } catch (err: any) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
}

/** 加载供应商 */
async function loadSuppliers() {
  try {
    supplierOptions.value = await http.get('/orders/options/factories');
  } catch (err) {
    console.error('加载供应商失败:', err);
  }
}

/** 一键检查齐套 */
async function handleCheckReady() {
  try {
    const result = await http.get(`/trims/check/${orderId.value}`);
    if (result.allReady) {
      uni.showToast({ title: '所有辅料已齐套', icon: 'success' });
    } else {
      const items = result.notReadyItems.map((i: any) => `${i.trimName}: ${i.missingSteps.join(', ')}`).join('\n');
      uni.showModal({ title: '辅料未齐套', content: items, showCancel: false });
    }
    await loadTrims();
  } catch (err) {
    uni.showToast({ title: '检查失败', icon: 'none' });
  }
}

// ========== 新增辅料 ==========
function openAddTrim() {
  newTrim.value = {
    trimName: '',
    trimCategory: '',
    specification: '',
    usagePerPiece: '',
    unit: 'pcs',
    supplierId: 0,
    remark: '',
  };
  if (supplierOptions.value.length === 0) {
    loadSuppliers();
  }
  showAddModal.value = true;
}

function onCategoryChange(e: any) {
  newTrim.value.trimCategory = trimCategoryOptions[e.detail.value].value;
}
function onUnitChange(e: any) {
  newTrim.value.unit = units[e.detail.value];
}
function onSupplierChange(e: any) {
  newTrim.value.supplierId = supplierOptions.value[e.detail.value].id;
}

async function handleAddTrim() {
  if (!newTrim.value.trimName.trim()) {
    uni.showToast({ title: '请输入辅料名称', icon: 'none' });
    return;
  }
  if (!newTrim.value.trimCategory) {
    uni.showToast({ title: '请选择辅料类型', icon: 'none' });
    return;
  }
  if (!newTrim.value.usagePerPiece || parseFloat(newTrim.value.usagePerPiece) <= 0) {
    uni.showToast({ title: '请输入每件用量', icon: 'none' });
    return;
  }

  try {
    await http.post(`/trims/${orderId.value}`, {
      trimName: newTrim.value.trimName.trim(),
      trimCategory: newTrim.value.trimCategory,
      specification: newTrim.value.specification || undefined,
      usagePerPiece: parseFloat(newTrim.value.usagePerPiece),
      unit: newTrim.value.unit,
      supplierId: newTrim.value.supplierId || undefined,
      remark: newTrim.value.remark || undefined,
    }, { showLoading: true, loadingText: '添加中...' });
    uni.showToast({ title: '添加成功', icon: 'success' });
    showAddModal.value = false;
    await loadTrims();
  } catch (err: any) {
    uni.showToast({ title: '添加失败', icon: 'none' });
  }
}

// ========== 打样更新 ==========
function openSamplingUpdate(trim: OrderTrim) {
  editingTrim.value = trim;
  samplingUpdate.value = {
    samplingStatus: trim.samplingStatus,
    samplingSentDate: trim.samplingSentDate ? formatDate(trim.samplingSentDate) : '',
    samplingApprovedDate: trim.samplingApprovedDate ? formatDate(trim.samplingApprovedDate) : '',
    samplingRemark: trim.samplingRemark || '',
  };
  showSamplingModal.value = true;
}

function onSamplingStatusChange(e: any) {
  samplingUpdate.value.samplingStatus = samplingStatusOptions[e.detail.value].value;
}

async function handleSamplingUpdate() {
  if (!editingTrim.value) return;
  try {
    await http.patch(`/trims/${editingTrim.value.id}/status`, samplingUpdate.value, {
      showLoading: true,
      loadingText: '保存中...',
    });
    uni.showToast({ title: '更新成功', icon: 'success' });
    showSamplingModal.value = false;
    await loadTrims();
  } catch (err: any) {
    uni.showToast({ title: '更新失败', icon: 'none' });
  }
}

// ========== 大货更新 ==========
function openBulkUpdate(trim: OrderTrim) {
  editingTrim.value = trim;
  bulkUpdate.value = {
    bulkPoNo: trim.bulkPoNo || '',
    bulkPoStatus: trim.bulkPoStatus,
    bulkPoDate: trim.bulkPoDate ? formatDate(trim.bulkPoDate) : '',
    bulkEtd: trim.bulkEtd ? formatDate(trim.bulkEtd) : '',
    bulkEta: trim.bulkEta ? formatDate(trim.bulkEta) : '',
    receivedQty: trim.receivedQty,
    qtyCheckStatus: trim.qtyCheckStatus,
    inspectionResult: trim.inspectionResult,
    inspectionNote: trim.inspectionNote || '',
  };
  showBulkModal.value = true;
}

function onBulkStatusChange(e: any) {
  bulkUpdate.value.bulkPoStatus = bulkStatusOptions[e.detail.value].value;
}
function onQtyCheckChange(e: any) {
  bulkUpdate.value.qtyCheckStatus = qtyCheckOptions[e.detail.value].value;
}
function onInspectionChange(e: any) {
  bulkUpdate.value.inspectionResult = inspectionOptions[e.detail.value].value;
}

async function handleBulkUpdate() {
  if (!editingTrim.value) return;
  const data: any = { ...bulkUpdate.value };
  // 清理空值
  Object.keys(data).forEach((key) => {
    if (data[key] === '' || data[key] === null) delete data[key];
  });
  try {
    await http.patch(`/trims/${editingTrim.value.id}/status`, data, {
      showLoading: true,
      loadingText: '保存中...',
    });
    uni.showToast({ title: '更新成功', icon: 'success' });
    showBulkModal.value = false;
    await loadTrims();
  } catch (err: any) {
    uni.showToast({ title: '更新失败', icon: 'none' });
  }
}

// ========== 工具函数 ==========
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSamplingStepClass(current: string, target: string): string {
  if (target === 'approved' && current === 'approved') return 'step-done';
  if (target === 'pending' && current === 'pending') return 'step-active';
  const order = ['pending', 'in_sampling', 'sent_for_approval', 'approved'];
  const currentIdx = order.indexOf(current);
  const targetIdx = order.indexOf(target);
  if (currentIdx > targetIdx) return 'step-done';
  if (currentIdx === targetIdx) return 'step-active';
  return '';
}

function getBulkStepClass(current: string, target: string): string {
  const order = ['not_ordered', 'ordered', 'producing', 'shipped', 'received'];
  const currentIdx = order.indexOf(current);
  const targetIdx = order.indexOf(target);
  if (current === 'received' && target === 'received') return 'step-done';
  if (currentIdx > targetIdx) return 'step-done';
  if (currentIdx === targetIdx) return 'step-active';
  return '';
}

onLoad((options: any) => {
  orderId.value = Number(options.orderId);
  loadTrims();
});
</script>

<style scoped>
.trim-manage-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
}

/* 齐套概览 */
.ready-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ready-info {
  flex: 1;
}
.ready-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #2C2C2A;
  margin-bottom: 12rpx;
  display: block;
}
.ready-bar {
  height: 12rpx;
  background: #F1EFE8;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}
.ready-bar-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s;
}
.fill-green { background: #1D9E75; }
.fill-amber { background: #F0A93B; }
.ready-text {
  font-size: 24rpx;
  color: #5F5E5A;
}
.check-btn {
  padding: 12rpx 24rpx;
  background: #E6F1FB;
  color: #185FA5;
  border-radius: 8rpx;
  font-size: 24rpx;
  flex-shrink: 0;
}

/* 辅料卡片 */
.trim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.trim-header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.trim-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2A;
}
.trim-info {
  margin-bottom: 16rpx;
}
.trim-section {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #5F5E5A;
}
.edit-btn {
  font-size: 24rpx;
  color: #185FA5;
  padding: 6rpx 16rpx;
  border: 1rpx solid #185FA5;
  border-radius: 8rpx;
}

/* 步骤条 */
.status-steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6rpx;
}
.status-step {
  padding: 6rpx 12rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  background: #F1EFE8;
  color: #888780;
}
.step-done { background: #E1F5EE; color: #0F6E56; }
.step-active { background: #E6F1FB; color: #185FA5; }
.step-line {
  width: 20rpx;
  height: 2rpx;
  background: #E0E0E0;
}
.line-active { background: #185FA5; }
.dates-row {
  display: flex;
  gap: 20rpx;
  margin-top: 8rpx;
}
.date-text {
  font-size: 22rpx;
  color: #888780;
}
.remark-text {
  font-size: 22rpx;
  color: #854F0B;
  margin-top: 8rpx;
}

/* 大货详情 */
.bulk-detail {
  margin-top: 12rpx;
  padding: 12rpx;
  background: #F8F8F6;
  border-radius: 8rpx;
}
.check-row {
  display: flex;
  gap: 30rpx;
  margin-top: 12rpx;
}
.check-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.check-label {
  font-size: 24rpx;
  color: #888780;
}

/* 信息行 */
.info-row {
  display: flex;
  padding: 8rpx 0;
  font-size: 26rpx;
}
.info-label {
  color: #888780;
  min-width: 120rpx;
}
.info-value {
  color: #333333;
  flex: 1;
}
.text-bold { font-weight: 600; }

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  gap: 20rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #B4B2A9;
}
.empty-action {
  font-size: 26rpx;
  color: #185FA5;
}

/* 浮动按钮 */
.fab-btn {
  position: fixed;
  bottom: 60rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  background: #185FA5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(24, 95, 165, 0.3);
  z-index: 90;
}
.fab-icon {
  font-size: 56rpx;
  color: #fff;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}
.modal-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.modal-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2A;
}
.modal-close {
  font-size: 32rpx;
  color: #B4B2A9;
}
.modal-body {
  flex: 1;
  padding: 24rpx;
  max-height: 60vh;
}
.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

/* 表单 */
.form-item { margin-bottom: 20rpx; }
.form-item.half { flex: 1; }
.form-row { display: flex; gap: 20rpx; }
.form-label {
  display: block;
  font-size: 26rpx;
  color: #5F5E5A;
  margin-bottom: 8rpx;
}
.form-label.required::after {
  content: ' *';
  color: #A32D2D;
}
.form-input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  background: #F8F8F6;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #2C2C2A;
  border: 1rpx solid #E0E0E0;
}
.form-textarea {
  width: 100%;
  min-height: 100rpx;
  padding: 16rpx 20rpx;
  background: #F8F8F6;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #2C2C2A;
  border: 1rpx solid #E0E0E0;
}
.form-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72rpx;
  padding: 0 20rpx;
  background: #F8F8F6;
  border-radius: 10rpx;
  border: 1rpx solid #E0E0E0;
  font-size: 28rpx;
  color: #2C2C2A;
}
.picker-arrow { color: #B4B2A9; }
.placeholder { color: #B4B2A9; }

/* 按钮 */
.btn-cancel {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background: #F1EFE8;
  color: #5F5E5A;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}
.btn-submit {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background: #185FA5;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

/* 标签 */
.tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
}
.tag-blue { background: #E6F1FB; color: #185FA5; }
.tag-green { background: #E1F5EE; color: #0F6E56; }
.tag-red { background: #FCEBEB; color: #A32D2D; }
.tag-amber { background: #FAEEDA; color: #854F0B; }
.tag-gray { background: #F1EFE8; color: #5F5E5A; }
</style>
