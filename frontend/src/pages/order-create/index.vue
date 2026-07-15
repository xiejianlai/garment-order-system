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
    <!-- ========== 订单基本信息 ========== -->
    <view class="card">
      <view class="card-title">订单基本信息</view>

      <view class="form-item">
        <text class="form-label required">订单号</text>
        <input
          v-model="form.orderNo"
          class="form-input"
          placeholder="如: PO-2026-001"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="form-label required">客户</text>
        <picker
          mode="selector"
          :range="customerNames"
          @change="onCustomerChange"
        >
          <view class="form-picker">
            <text :class="{ 'placeholder': !form.customerId }">
              {{ selectedCustomerName || '请选择客户' }}
            </text>
            <text class="picker-arrow">></text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label required">款号</text>
        <input
          v-model="form.styleNo"
          class="form-input"
          placeholder="如: TS-001"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-item">
        <text class="form-label">款式名称</text>
        <input
          v-model="form.styleName"
          class="form-input"
          placeholder="如: 男士连帽卫衣"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-row">
        <view class="form-item half">
          <text class="form-label">季节</text>
          <picker
            mode="selector"
            :range="seasons"
            @change="onSeasonChange"
          >
            <view class="form-picker">
              <text :class="{ 'placeholder': !form.season }">
                {{ form.season || '请选择' }}
              </text>
              <text class="picker-arrow">></text>
            </view>
          </picker>
        </view>
        <view class="form-item half">
          <text class="form-label">品类</text>
          <input
            v-model="form.category"
            class="form-input"
            placeholder="如: 卫衣"
            placeholder-class="placeholder"
          />
        </view>
      </view>

      <view class="form-item">
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

      <view class="form-item">
        <text class="form-label">分配工厂</text>
        <picker
          mode="selector"
          :range="factoryNames"
          @change="onFactoryChange"
        >
          <view class="form-picker">
            <text :class="{ 'placeholder': !form.assignedFactoryId }">
              {{ selectedFactoryName || '请选择工厂（可稍后分配）' }}
            </text>
            <text class="picker-arrow">></text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">衣服图片</text>
        <view class="image-upload-area">
          <view v-if="form.garmentImageUrl" class="image-preview">
            <image :src="form.garmentImageUrl" mode="aspectFit" class="preview-img" />
            <text class="remove-img" @tap="form.garmentImageUrl = ''">x</text>
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
        颜色尺码矩阵
        <text class="card-subtitle">总数量: {{ totalQty }} 件</text>
      </view>

      <!-- 颜色/尺码输入 -->
      <view class="matrix-config">
        <view class="form-item">
          <text class="form-label">颜色</text>
          <view class="tag-input-area">
            <view class="tag-list">
              <view v-for="(color, idx) in colors" :key="idx" class="input-tag">
                <text>{{ color }}</text>
                <text class="tag-remove" @tap="removeColor(idx)">x</text>
              </view>
            </view>
            <view class="tag-add-row">
              <input
                v-model="newColor"
                class="tag-input"
                placeholder="输入颜色名称"
                placeholder-class="placeholder"
                @confirm="addColor"
              />
              <text class="add-btn" @tap="addColor">添加</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">尺码</text>
          <view class="tag-input-area">
            <view class="tag-list">
              <view v-for="(size, idx) in sizes" :key="idx" class="input-tag">
                <text>{{ size }}</text>
                <text class="tag-remove" @tap="removeSize(idx)">x</text>
              </view>
            </view>
            <view class="tag-add-row">
              <input
                v-model="newSize"
                class="tag-input"
                placeholder="输入尺码名称"
                placeholder-class="placeholder"
                @confirm="addSize"
              />
              <text class="add-btn" @tap="addSize">添加</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 矩阵表格 -->
      <view v-if="colors.length > 0 && sizes.length > 0" class="matrix-table">
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
          <view v-for="size in sizes" :key="size" class="matrix-cell">
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

      <!-- 快捷操作 -->
      <view v-if="colors.length > 0 && sizes.length > 0" class="quick-actions">
        <text class="quick-btn" @tap="fillAllEqual">均分数量</text>
        <text class="quick-btn" @tap="clearMatrix">清空矩阵</text>
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
import { ref, computed } from 'vue';
import { createOrder, getCustomerOptions, getFactoryOptions } from '../../api/orders';
import { uploadFile } from '../../utils/request';
import type { CreateOrderPayload } from '../../api/orders';

// 表单数据
const form = ref({
  orderNo: '',
  customerId: 0,
  styleNo: '',
  styleName: '',
  season: '',
  category: '',
  garmentImageUrl: '',
  deliveryDate: '',
  assignedFactoryId: 0,
  remark: '',
});

// 颜色和尺码
const colors = ref<string[]>([]);
const sizes = ref<string[]>([]);
const newColor = ref('');
const newSize = ref('');

// 矩阵数据: { "红色|S": 100, "红色|M": 200 }
const matrixData = ref<Record<string, number>>({});

// 客户和工厂数据
const customers = ref<any[]>([]);
const factories = ref<any[]>([]);
const seasons = ['春季', '夏季', '秋季', '冬季', '全年'];

const customerNames = computed(() => customers.value.map((c) => c.customerName));
const factoryNames = computed(() => factories.value.map((f) => f.factoryName));
const selectedCustomerName = computed(() =>
  customers.value.find((c) => c.id === form.value.customerId)?.customerName || '',
);
const selectedFactoryName = computed(() =>
  factories.value.find((f) => f.id === form.value.assignedFactoryId)?.factoryName || '',
);

const submitting = ref(false);

/** 总数量 */
const totalQty = computed(() => {
  return Object.values(matrixData.value).reduce((sum, n) => sum + (n || 0), 0);
});

// 页面加载时获取客户和工厂数据
async function loadOptions() {
  try {
    const [customerRes, factoryRes] = await Promise.all([
      getCustomerOptions(),
      getFactoryOptions(),
    ]);
    customers.value = customerRes || [];
    factories.value = factoryRes || [];
  } catch (err) {
    console.error('加载选项数据失败:', err);
  }
}
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

/** 颜色/尺码管理 */
function addColor() {
  const val = newColor.value.trim();
  if (val && !colors.value.includes(val)) {
    colors.value.push(val);
  }
  newColor.value = '';
}
function removeColor(idx: number) {
  const color = colors.value[idx];
  colors.value.splice(idx, 1);
  // 清理矩阵中该颜色的数据
  sizes.value.forEach((size) => {
    delete matrixData.value[`${color}|${size}`];
  });
}
function addSize() {
  const val = newSize.value.trim();
  if (val && !sizes.value.includes(val)) {
    sizes.value.push(val);
  }
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
function onCustomerChange(e: any) {
  const idx = e.detail.value;
  form.value.customerId = customers.value[idx]?.id || 0;
}
function onFactoryChange(e: any) {
  const idx = e.detail.value;
  form.value.assignedFactoryId = factories.value[idx]?.id || 0;
}
function onSeasonChange(e: any) {
  form.value.season = seasons[e.detail.value];
}
function onDateChange(e: any) {
  form.value.deliveryDate = e.detail.value;
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
        form.value.garmentImageUrl = result.fileUrl;
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
  // 表单校验
  if (!form.value.orderNo.trim()) {
    uni.showToast({ title: '请输入订单号', icon: 'none' });
    return;
  }
  if (!form.value.customerId) {
    uni.showToast({ title: '请选择客户', icon: 'none' });
    return;
  }
  if (!form.value.styleNo.trim()) {
    uni.showToast({ title: '请输入款号', icon: 'none' });
    return;
  }
  if (!form.value.deliveryDate) {
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
  try {
    // 构建颜色尺码数据
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
      orderNo: form.value.orderNo.trim(),
      customerId: form.value.customerId,
      styleNo: form.value.styleNo.trim(),
      styleName: form.value.styleName.trim() || undefined,
      season: form.value.season || undefined,
      category: form.value.category.trim() || undefined,
      garmentImageUrl: form.value.garmentImageUrl || undefined,
      deliveryDate: form.value.deliveryDate,
      assignedFactoryId: form.value.assignedFactoryId || undefined,
      colorSizes,
      remark: form.value.remark.trim() || undefined,
    };

    await createOrder(payload);
    uni.showToast({ title: '订单创建成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (err: any) {
    uni.showToast({ title: '创建失败: ' + err.message, icon: 'none' });
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
  color: #185FA5;
  font-size: 22rpx;
  opacity: 0.7;
}
.tag-add-row {
  display: flex;
  gap: 12rpx;
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
  padding: 0 24rpx;
  height: 64rpx;
  line-height: 64rpx;
  background: #185FA5;
  color: #fff;
  border-radius: 8rpx;
  font-size: 26rpx;
  text-align: center;
}

/* 矩阵表格 */
.matrix-table {
  border: 1rpx solid #E0E0E0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-top: 12rpx;
}
.matrix-row {
  display: flex;
  border-bottom: 1rpx solid #f0f0f0;
}
.matrix-row:last-child {
  border-bottom: none;
}
.matrix-cell {
  flex: 1;
  text-align: center;
  padding: 12rpx 4rpx;
  font-size: 24rpx;
  border-right: 1rpx solid #f0f0f0;
  min-height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.matrix-cell:last-child {
  border-right: none;
}
.matrix-header {
  background: #F1EFE8;
}
.matrix-corner {
  font-weight: 600;
  color: #5F5E5A;
  min-width: 100rpx;
  flex: 1.2;
  font-size: 22rpx;
}
.matrix-size-header {
  font-weight: 600;
  color: #5F5E5A;
  min-width: 80rpx;
}
.matrix-total-header {
  font-weight: 600;
  color: #0F6E56;
  background: #E1F5EE;
}
.matrix-color-cell {
  font-weight: 500;
  color: #2C2C2A;
  min-width: 100rpx;
  flex: 1.2;
}
.matrix-total-cell {
  background: #F0FBF7;
  font-weight: 600;
  color: #0F6E56;
}
.matrix-footer {
  background: #F1EFE8;
}
.matrix-footer .matrix-cell {
  font-weight: 600;
}
.matrix-size-total {
  color: #5F5E5A;
}
.matrix-grand-total {
  background: #E1F5EE;
  color: #0F6E56;
  font-weight: 700;
  font-size: 28rpx;
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
