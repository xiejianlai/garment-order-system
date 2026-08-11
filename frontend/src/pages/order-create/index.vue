<!--
  订单创建页 — 小程序 + H5 双端

  功能:
  1. 订单基本信息表单（订单号、客户、款号、交期等）
  2. 颜色尺码矩阵动态录入（核心功能）
  3. 衣服图片上传
  4. 提交创建订单

  权限: 仅 admin/merchandiser 可访问
-->
<template>
  <view class="create-page">
    <!-- 调试状态栏 -->
    <view class="debug-bar">
      <text class="debug-text">Token: {{ tokenStatus }} | 选项: {{ optionsStatus }} | 提交: {{ submitStatus }}</text>
    </view>

    <!-- ========== 订单基本信息 ========== -->
    <view class="card">
      <view class="card-title">订单基本信息</view>

      <!-- 订单号 + 客户 → 一行 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label required">订单号</text>
          <input
            v-model="form.orderNo"
            class="form-input"
            placeholder="如: PO-2026-001"
            placeholder-class="placeholder"
          />
        </view>
        <view class="form-item half">
          <text class="form-label required">客户</text>
          <input
            v-model="form.customerName"
            class="form-input"
            placeholder="输入或选择客户"
            placeholder-class="placeholder"
          />
        </view>
      </view>
      <scroll-view v-if="options.customers.length > 0" scroll-x class="chip-bar" show-scrollbar="false">
        <view
          v-for="c in options.customers"
          :key="c.id"
          class="chip"
          @tap="form.customerName = c.name"
        >{{ c.name }}</view>
      </scroll-view>

      <!-- 款号 + 款式名称 → 一行 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label required">款号</text>
          <input
            v-model="form.styleNo"
            class="form-input"
            placeholder="如: TS-001"
            placeholder-class="placeholder"
          />
        </view>
        <view class="form-item half">
          <text class="form-label">款式名称</text>
          <input
            v-model="form.styleName"
            class="form-input"
            placeholder="如: 男士连帽卫衣"
            placeholder-class="placeholder"
          />
        </view>
      </view>

      <!-- 季节 + 交期 → 一行 (季节只保留输入框) -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label">季节</text>
          <input
            v-model="form.season"
            class="form-input"
            placeholder="如: 2026春季"
            placeholder-class="placeholder"
          />
        </view>
        <view class="form-item half">
          <text class="form-label required">交期</text>
          <picker
            mode="date"
            :value="form.deliveryDate"
            @change="onDateChange"
          >
            <view class="form-picker">
              <text :class="{ 'placeholder': !form.deliveryDate }">
                {{ form.deliveryDate || '请选择交期' }}
              </text>
              <text class="picker-arrow">></text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 品类 + 工厂 → 一行 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label">品类</text>
          <input
            v-model="form.category"
            class="form-input"
            placeholder="如: 卫衣"
            placeholder-class="placeholder"
          />
          <view class="chip-bar-static" v-if="localCategories.length > 0">
            <view
              v-for="c in localCategories"
              :key="c"
              class="chip-sm"
              @tap="form.category = c"
            >{{ c }}</view>
          </view>
        </view>
        <view class="form-item half">
          <text class="form-label">分配工厂</text>
          <input
            v-model="form.factoryName"
            class="form-input"
            placeholder="输入或选择工厂"
            placeholder-class="placeholder"
          />
          <view class="chip-bar-static" v-if="localFactories.length > 0">
            <view
              v-for="f in localFactories"
              :key="f"
              class="chip-sm"
              @tap="form.factoryName = f"
            >{{ f }}</view>
          </view>
        </view>
      </view>

      <!-- 理单 + 跟单 → 一行 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label">理单</text>
          <input
            v-model="form.coordinatorName"
            class="form-input"
            placeholder="输入或选择理单"
            placeholder-class="placeholder"
          />
          <view class="chip-bar-static" v-if="localCoordinators.length > 0">
            <view
              v-for="c in localCoordinators"
              :key="c"
              class="chip-sm"
              @tap="form.coordinatorName = c"
            >{{ c }}</view>
          </view>
        </view>
        <view class="form-item half">
          <text class="form-label">跟单</text>
          <input
            v-model="form.merchandiserName"
            class="form-input"
            placeholder="输入或选择跟单"
            placeholder-class="placeholder"
          />
          <view class="chip-bar-static" v-if="localMerchandisers.length > 0">
            <view
              v-for="m in localMerchandisers"
              :key="m"
              class="chip-sm"
              @tap="form.merchandiserName = m"
            >{{ m }}</view>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">衣服图片</text>
        <view class="image-upload-area">
          <view v-if="form.garmentImageUrl" class="image-preview">
            <image :src="form.garmentImageUrl" mode="aspectFit" class="preview-img" />
            <view class="remove-img" @tap="form.garmentImageUrl = ''"><text>x</text></view>
          </view>
          <view v-else class="upload-btn" @tap="uploadImage">
            <text class="upload-icon">+</text>
            <text class="upload-text">上传图片</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">备注</text>
        <textarea
          v-model="form.remark"
          class="form-textarea"
          placeholder="订单备注信息..."
          placeholder-class="placeholder"
        />
      </view>
    </view>

    <!-- ========== 颜色尺码矩阵 ========== -->
    <view class="card">
      <view class="card-title">
        <text>颜色尺码矩阵</text>
        <text class="card-subtitle">总数量: {{ totalQty }} 件</text>
      </view>

      <!-- 颜色/尺码输入 -->
      <view class="matrix-config">
        <view class="form-item">
          <text class="form-label">颜色</text>
          <view class="tag-input-area">
            <view v-if="colors.length > 0" class="tag-list">
              <view v-for="(color, idx) in colors" :key="idx" class="input-tag">
                <text>{{ color }}</text>
                <view class="tag-remove" @tap="removeColor(idx)"><text>x</text></view>
              </view>
            </view>
            <view class="tag-add-row">
              <input
                :value="newColor"
                class="tag-input"
                placeholder="输入颜色名称"
                placeholder-class="placeholder"
                @input="onColorInput"
                @confirm="addColor"
              />
              <view class="add-btn" @tap="addColor"><text class="add-btn-text">添加</text></view>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">尺码</text>
          <view class="tag-input-area">
            <view v-if="sizes.length > 0" class="tag-list">
              <view v-for="(size, idx) in sizes" :key="idx" class="input-tag">
                <text>{{ size }}</text>
                <view class="tag-remove" @tap="removeSize(idx)"><text>x</text></view>
              </view>
            </view>
            <view class="tag-add-row">
              <input
                :value="newSize"
                class="tag-input"
                placeholder="输入尺码名称"
                placeholder-class="placeholder"
                @input="onSizeInput"
                @confirm="addSize"
              />
              <view class="add-btn" @tap="addSize"><text class="add-btn-text">添加</text></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 矩阵表格 — 横向可滚动，支持20+尺码 -->
      <view v-if="colors.length > 0 && sizes.length > 0" class="matrix-wrapper">
        <scroll-view scroll-x class="matrix-scroll" show-scrollbar="false">
          <view class="matrix-table">
            <!-- 表头 -->
            <view class="matrix-row matrix-header">
              <view class="matrix-cell matrix-corner">颜色\尺码</view>
              <view v-for="size in sizes" :key="size" class="matrix-cell matrix-size-header">
                {{ size }}
              </view>
              <view class="matrix-cell matrix-total-header">小计</view>
            </view>
            <!-- 数据行 -->
            <view v-for="color in colors" :key="color" class="matrix-row">
              <view class="matrix-cell matrix-color-cell">{{ color }}</view>
              <view v-for="size in sizes" :key="size" class="matrix-cell matrix-input-cell">
                <input
                  :value="getMatrixValue(color, size)"
                  class="matrix-input"
                  type="number"
                  placeholder="0"
                  placeholder-class="placeholder"
                  @input="onMatrixInput(color, size, $event)"
                />
              </view>
              <view class="matrix-cell matrix-total-cell">{{ getColorTotal(color) }}</view>
            </view>
            <!-- 合计行 -->
            <view class="matrix-row matrix-footer">
              <view class="matrix-cell matrix-color-cell">合计</view>
              <view v-for="size in sizes" :key="size" class="matrix-cell matrix-size-total">
                {{ getSizeTotal(size) }}
              </view>
              <view class="matrix-cell matrix-grand-total">{{ totalQty }}</view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 快捷操作 -->
      <view v-if="colors.length > 0 && sizes.length > 0" class="quick-actions">
        <view class="quick-btn" @tap="fillAllEqual"><text>均分数量</text></view>
        <view class="quick-btn" @tap="clearMatrix"><text>清空矩阵</text></view>
      </view>
    </view>

    <!-- ========== 提交按钮 ========== -->
    <view class="submit-area">
      <button class="btn-cancel" @tap="handleCancel">取消</button>
      <button class="btn-submit" :disabled="submitting" @tap="handleSubmit">
        {{ submitting ? '创建中...' : '创建订单' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { createOrder, getOrderOptions } from '../../api/orders';
import { uploadFile } from '../../utils/request';
import { getToken } from '../../utils/auth';
import type { CreateOrderPayload } from '../../api/orders';

// 调试状态
const tokenStatus = ref('检查中...');
const optionsStatus = ref('加载中...');
const submitStatus = ref('就绪');

// 初始化时检查 token
const initToken = getToken();
if (initToken) {
  tokenStatus.value = '有效(' + initToken.substring(0, 8) + '...)';
  console.log('[CreateOrder] Token OK');
} else {
  tokenStatus.value = '无效!';
  console.warn('[CreateOrder] 无Token!');
}

// 表单数据
const form = reactive({
  orderNo: '',
  customerName: '',
  styleNo: '',
  styleName: '',
  season: '',
  category: '',
  garmentImageUrl: '',
  deliveryDate: '',
  factoryName: '',
  coordinatorName: '',
  merchandiserName: '',
  remark: '',
});

// 颜色和尺码
const colors = ref<string[]>([]);
const sizes = ref<string[]>([]);
const newColor = ref('');
const newSize = ref('');

// 矩阵数据: { "红色|S": 100, "红色|M": 200 }
const matrixData = ref<Record<string, number>>({});

// 下拉选项数据（从后端加载）
const options = reactive<{
  customers: { id: number; code: string; name: string }[];
  factories: { id: number; code: string; name: string; type: string }[];
  coordinators: { id: number; name: string }[];
  merchandisers: { id: number; name: string }[];
}>({
  customers: [],
  factories: [],
  coordinators: [],
  merchandisers: [],
});

// 本地缓存的选项（输入新值后自动记忆）
const localCategories = ref<string[]>([]);
const localFactories = ref<string[]>([]);
const localCoordinators = ref<string[]>([]);
const localMerchandisers = ref<string[]>([]);

/** 从本地缓存加载历史输入 */
function loadLocalOptions() {
  try {
    localCategories.value = uni.getStorageSync('local_categories') || [];
    localFactories.value = uni.getStorageSync('local_factories') || [];
    localCoordinators.value = uni.getStorageSync('local_coordinators') || [];
    localMerchandisers.value = uni.getStorageSync('local_merchandisers') || [];
  } catch (e) {
    console.error('加载本地选项失败:', e);
  }
}

/** 保存新值到本地缓存 */
function saveLocalOption(key: string, list: string[], value: string) {
  const val = value.trim();
  if (!val || list.includes(val)) return;
  list.push(val);
  try {
    uni.setStorageSync(key, list);
  } catch (e) {
    console.error('保存本地选项失败:', e);
  }
}

const submitting = ref(false);

/** 总数量 */
const totalQty = computed(() => {
  return Object.values(matrixData.value).reduce((sum, n) => sum + (n || 0), 0);
});

// 页面加载时获取选项数据
async function loadOptions() {
  try {
    const res = await getOrderOptions();
    options.customers = res.customers || [];
    options.factories = res.factories || [];
    options.coordinators = res.coordinators || [];
    options.merchandisers = res.merchandisers || [];
    optionsStatus.value = `OK(客${options.customers.length}/厂${options.factories.length}/理${options.coordinators.length})`;
    console.log('[CreateOrder] 选项加载成功:', optionsStatus.value);
    // 后端返回的也加入本地缓存显示
    options.factories.forEach((f) => {
      if (!localFactories.value.includes(f.name)) localFactories.value.push(f.name);
    });
    options.coordinators.forEach((c) => {
      if (!localCoordinators.value.includes(c.name)) localCoordinators.value.push(c.name);
    });
    options.merchandisers.forEach((m) => {
      if (!localMerchandisers.value.includes(m.name)) localMerchandisers.value.push(m.name);
    });
  } catch (err: any) {
    optionsStatus.value = '失败: ' + (err.message || '未知');
    console.error('[CreateOrder] 加载选项数据失败:', err);
  }
}
loadLocalOptions();
loadOptions();

/** 矩阵操作 */
function getMatrixValue(color: string, size: string): string {
  return String(matrixData.value[`${color}|${size}`] || '');
}
function onMatrixInput(color: string, size: string, e: any) {
  const val = parseInt(e.detail.value) || 0;
  matrixData.value[`${color}|${size}`] = val;
}
function getColorTotal(color: string): number {
  return sizes.value.reduce((sum, size) => sum + (matrixData.value[`${color}|${size}`] || 0), 0);
}
function getSizeTotal(size: string): number {
  return colors.value.reduce((sum, color) => sum + (matrixData.value[`${color}|${size}`] || 0), 0);
}

/** 颜色输入 — 用 @input 替代 v-model，确保小程序端可靠 */
function onColorInput(e: any) {
  newColor.value = e.detail.value;
}
/** 尺码输入 */
function onSizeInput(e: any) {
  newSize.value = e.detail.value;
}

/** 颜色/尺码管理 */
function addColor() {
  const val = newColor.value.trim();
  if (!val) {
    uni.showToast({ title: '请输入颜色名称', icon: 'none' });
    return;
  }
  if (colors.value.includes(val)) {
    uni.showToast({ title: '该颜色已存在', icon: 'none' });
    return;
  }
  colors.value.push(val);
  newColor.value = '';
}
function removeColor(idx: number) {
  const color = colors.value[idx];
  colors.value.splice(idx, 1);
  sizes.value.forEach((size) => {
    delete matrixData.value[`${color}|${size}`];
  });
}
function addSize() {
  const val = newSize.value.trim();
  if (!val) {
    uni.showToast({ title: '请输入尺码名称', icon: 'none' });
    return;
  }
  if (sizes.value.includes(val)) {
    uni.showToast({ title: '该尺码已存在', icon: 'none' });
    return;
  }
  sizes.value.push(val);
  newSize.value = '';
}
function removeSize(idx: number) {
  const size = sizes.value[idx];
  sizes.value.splice(idx, 1);
  colors.value.forEach((color) => {
    delete matrixData.value[`${color}|${size}`];
  });
}

/** 快捷操作 */
function fillAllEqual() {
  uni.showModal({
    title: '均分数量',
    content: '请输入每个颜色尺码的数量',
    editable: true,
    placeholderText: '如: 100',
    success: (res) => {
      if (res.confirm) {
        const qty = parseInt(res.content) || 0;
        colors.value.forEach((color) => {
          sizes.value.forEach((size) => {
            matrixData.value[`${color}|${size}`] = qty;
          });
        });
      }
    },
  });
}
function clearMatrix() {
  matrixData.value = {};
}

/** 选择器 */
function onDateChange(e: any) {
  form.deliveryDate = e.detail.value;
}

/** 上传图片 */
async function uploadImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0];
      try {
        uni.showLoading({ title: '上传中...' });
        const result = await uploadFile('/files/upload/garment-image', tempPath, 'file');
        form.garmentImageUrl = result.fileUrl;
        uni.showToast({ title: '上传成功', icon: 'success' });
      } catch (err: any) {
        uni.showToast({ title: '上传失败: ' + err.message, icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
  });
}

/** 提交创建订单 */
async function handleSubmit() {
  if (!form.orderNo.trim()) {
    uni.showToast({ title: '请输入订单号', icon: 'none' });
    return;
  }
  if (!form.customerName.trim()) {
    uni.showToast({ title: '请输入或选择客户', icon: 'none' });
    return;
  }
  if (!form.styleNo.trim()) {
    uni.showToast({ title: '请输入款号', icon: 'none' });
    return;
  }
  if (!form.deliveryDate) {
    uni.showToast({ title: '请选择交期', icon: 'none' });
    return;
  }
  if (colors.value.length === 0 || sizes.value.length === 0) {
    uni.showToast({ title: '请至少添加一个颜色和尺码', icon: 'none' });
    return;
  }
  if (totalQty.value === 0) {
    uni.showToast({ title: '请录入颜色尺码数量', icon: 'none' });
    return;
  }

  submitting.value = true;
  submitStatus.value = '提交中...';
  try {
    const colorSizes: any[] = [];
    colors.value.forEach((color, colorIdx) => {
      sizes.value.forEach((size, sizeIdx) => {
        const qty = matrixData.value[`${color}|${size}`] || 0;
        if (qty > 0) {
          colorSizes.push({
            color,
            size,
            quantity: qty,
            sortOrder: colorIdx * 100 + sizeIdx,
          });
        }
      });
    });

    const payload: CreateOrderPayload = {
      orderNo: form.orderNo.trim(),
      customerName: form.customerName.trim(),
      styleNo: form.styleNo.trim(),
      styleName: form.styleName.trim() || undefined,
      season: form.season.trim() || undefined,
      category: form.category.trim() || undefined,
      garmentImageUrl: form.garmentImageUrl || undefined,
      deliveryDate: form.deliveryDate,
      factoryName: form.factoryName.trim() || undefined,
      coordinatorName: form.coordinatorName.trim() || undefined,
      merchandiserName: form.merchandiserName.trim() || undefined,
      colorSizes,
      remark: form.remark.trim() || undefined,
    };

    console.log('[CreateOrder] 准备提交:', JSON.stringify(payload).substring(0, 200));
    const result = await createOrder(payload);
    console.log('[CreateOrder] 创建成功:', result);
    submitStatus.value = '成功!';

    // 自动记忆新输入的值
    if (form.category.trim()) saveLocalOption('local_categories', localCategories.value, form.category);
    if (form.factoryName.trim()) saveLocalOption('local_factories', localFactories.value, form.factoryName);
    if (form.coordinatorName.trim()) saveLocalOption('local_coordinators', localCoordinators.value, form.coordinatorName);
    if (form.merchandiserName.trim()) saveLocalOption('local_merchandisers', localMerchandisers.value, form.merchandiserName);

    uni.showToast({ title: '订单创建成功', icon: 'success' });
    // 通知列表页刷新（比单纯依赖 onShow 更可靠）
    uni.$emit('orderCreated');
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (err: any) {
    submitStatus.value = '失败: ' + (err.message || '未知');
    console.error('[CreateOrder] 创建失败:', err);
    uni.showToast({ title: '创建失败: ' + (err.message || '未知错误'), icon: 'none', duration: 3000 });
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  uni.navigateBack();
}
</script>

<style scoped>
.create-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.debug-bar {
  padding: 6rpx 20rpx;
  background: #FFF8E1;
  border-bottom: 1rpx solid #FFE082;
}

.debug-text {
  font-size: 20rpx;
  color: #854F0B;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2A;
  margin-bottom: 20rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-subtitle {
  font-size: 24rpx;
  font-weight: 400;
  color: #0F6E56;
}

/* 表单 */
.form-item {
  margin-bottom: 20rpx;
}
.form-item.half {
  flex: 1;
}
.form-row {
  display: flex;
  gap: 20rpx;
}
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
  box-sizing: border-box;
}
.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx 20rpx;
  background: #F8F8F6;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #2C2C2A;
  border: 1rpx solid #E0E0E0;
  box-sizing: border-box;
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
.picker-arrow {
  color: #B4B2A9;
  font-size: 28rpx;
}
.placeholder {
  color: #B4B2A9;
}

/* 可填写可选择的 chip 条 */
.chip-bar {
  display: flex;
  white-space: nowrap;
  padding: 8rpx 0 0;
  gap: 10rpx;
}
.chip-bar-static {
  display: flex;
  flex-wrap: wrap;
  padding: 8rpx 0 0;
  gap: 8rpx;
}
.chip {
  display: inline-block;
  padding: 6rpx 18rpx;
  background: #E6F1FB;
  color: #185FA5;
  border-radius: 6rpx;
  font-size: 24rpx;
  flex-shrink: 0;
}
.chip-sm {
  display: inline-block;
  padding: 4rpx 14rpx;
  background: #F1EFE8;
  color: #5F5E5A;
  border-radius: 6rpx;
  font-size: 22rpx;
}

/* 图片上传 */
.image-upload-area {
  display: flex;
  align-items: center;
}
.image-preview {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid #E0E0E0;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.remove-img {
  position: absolute;
  top: 4rpx;
  right: 8rpx;
  color: #fff;
  font-size: 24rpx;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #C0C0C0;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.upload-icon {
  font-size: 48rpx;
  color: #B4B2A9;
}
.upload-text {
  font-size: 24rpx;
  color: #B4B2A9;
}

/* 颜色尺码矩阵 */
.matrix-config {
  margin-bottom: 20rpx;
}
.tag-input-area {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.input-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #E6F1FB;
  color: #185FA5;
  border-radius: 8rpx;
  font-size: 24rpx;
}
.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: rgba(24,95,165,0.15);
  font-size: 22rpx;
}
.tag-add-row {
  display: flex;
  gap: 12rpx;
  align-items: center;
}
.tag-input {
  flex: 1;
  height: 64rpx;
  padding: 0 20rpx;
  background: #F8F8F6;
  border-radius: 8rpx;
  border: 1rpx solid #E0E0E0;
  font-size: 26rpx;
}
.add-btn {
  padding: 0 28rpx;
  height: 64rpx;
  background: #185FA5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-btn-text {
  color: #fff;
  font-size: 26rpx;
}

/* 矩阵表格 — 横向滚动 */
.matrix-wrapper {
  margin-top: 12rpx;
  border-radius: 8rpx;
  overflow: hidden;
}
.matrix-scroll {
  width: 100%;
  white-space: nowrap;
}
.matrix-table {
  display: inline-block;
  min-width: 100%;
  border: 1rpx solid #E0E0E0;
  border-radius: 8rpx;
}
.matrix-row {
  display: flex;
  border-bottom: 1rpx solid #f0f0f0;
}
.matrix-row:last-child {
  border-bottom: none;
}
.matrix-cell {
  flex-shrink: 0;
  text-align: center;
  padding: 12rpx 2rpx;
  font-size: 24rpx;
  border-right: 1rpx solid #f0f0f0;
  min-height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.matrix-cell:last-child {
  border-right: none;
}
.matrix-corner {
  font-weight: 600;
  color: #5F5E5A;
  width: 140rpx;
  min-width: 140rpx;
  font-size: 22rpx;
}
.matrix-color-cell {
  font-weight: 500;
  color: #2C2C2A;
  width: 140rpx;
  min-width: 140rpx;
}
.matrix-size-header {
  font-weight: 600;
  color: #5F5E5A;
  width: 100rpx;
  min-width: 100rpx;
}
.matrix-input-cell {
  width: 100rpx;
  min-width: 100rpx;
  padding: 4rpx 2rpx;
}
.matrix-total-header {
  font-weight: 600;
  color: #0F6E56;
  background: #E1F5EE;
  width: 110rpx;
  min-width: 110rpx;
}
.matrix-total-cell {
  background: #F0FBF7;
  font-weight: 600;
  color: #0F6E56;
  width: 110rpx;
  min-width: 110rpx;
}
.matrix-footer {
  background: #F1EFE8;
}
.matrix-footer .matrix-cell {
  font-weight: 600;
}
.matrix-size-total {
  color: #5F5E5A;
  width: 100rpx;
  min-width: 100rpx;
}
.matrix-grand-total {
  background: #E1F5EE;
  color: #0F6E56;
  font-weight: 700;
  font-size: 28rpx;
  width: 110rpx;
  min-width: 110rpx;
}
.matrix-input {
  width: 100%;
  height: 56rpx;
  text-align: center;
  font-size: 24rpx;
  color: #2C2C2A;
  background: transparent;
  border: none;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
.quick-btn {
  padding: 8rpx 20rpx;
  background: #F1EFE8;
  color: #5F5E5A;
  border-radius: 8rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 提交 */
.submit-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-top: 1rpx solid #E0E0E0;
  z-index: 100;
}
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
  flex: 2;
  height: 80rpx;
  line-height: 80rpx;
  background: #185FA5;
  color: #fff;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}
.btn-submit[disabled] {
  opacity: 0.6;
}
</style>
