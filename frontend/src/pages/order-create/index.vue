<!--
  订单创建页 — 简洁版
  所有字段自由输入，历史输入自动保存为下拉选项
-->
<template>
  <view class="create-page">
    <!-- 调试状态栏 -->
    <view class="debug-bar">
      <text class="debug-text">提交: {{ submitStatus }}</text>
    </view>

    <!-- ========== 订单基本信息 ========== -->
    <view class="card">
      <view class="card-title">订单基本信息</view>

      <!-- 订单号 + 客户 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label required">订单号</text>
          <input v-model="form.orderNo" class="form-input" placeholder="如: PO-2026-001" placeholder-class="placeholder" />
        </view>
        <view class="form-item half">
          <text class="form-label required">客户</text>
          <view class="combo-wrap">
            <input v-model="form.customerName" class="combo-input" placeholder="输入客户名" placeholder-class="placeholder" @focus="comboOpenKey = 'local_customers'" @blur="comboBlur('local_customers')" />
            <view class="combo-arrow" @tap.stop="toggleCombo('local_customers')"><text :class="['combo-arrow-text', comboOpenKey === 'local_customers' ? 'open' : '']">▼</text></view>
            <view v-if="comboOpenKey === 'local_customers' && comboOptions('local_customers').length > 0" class="combo-dropdown">
              <view v-for="item in comboOptions('local_customers')" :key="item" class="combo-item" @tap.stop="selectCombo('local_customers', item)">{{ item }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 款号 + 款式名称 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label required">款号</text>
          <input v-model="form.styleNo" class="form-input" placeholder="如: TS-001" placeholder-class="placeholder" />
        </view>
        <view class="form-item half">
          <text class="form-label">款式名称</text>
          <input v-model="form.styleName" class="form-input" placeholder="如: 男士连帽卫衣" placeholder-class="placeholder" />
        </view>
      </view>

      <!-- 季节 + 交期 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label">季节</text>
          <input v-model="form.season" class="form-input" placeholder="如: 2026春季" placeholder-class="placeholder" />
        </view>
        <view class="form-item half">
          <text class="form-label required">交期</text>
          <picker mode="date" :value="form.deliveryDate" @change="onDateChange">
            <view class="form-picker">
              <text :class="{ 'placeholder': !form.deliveryDate }">{{ form.deliveryDate || '请选择交期' }}</text>
              <text class="picker-arrow">></text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 品类 + 工厂 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label">品类</text>
          <view class="combo-wrap">
            <input v-model="form.category" class="combo-input" placeholder="如: 卫衣" placeholder-class="placeholder" @focus="comboOpenKey = 'local_categories'" @blur="comboBlur('local_categories')" />
            <view class="combo-arrow" @tap.stop="toggleCombo('local_categories')"><text :class="['combo-arrow-text', comboOpenKey === 'local_categories' ? 'open' : '']">▼</text></view>
            <view v-if="comboOpenKey === 'local_categories' && comboOptions('local_categories').length > 0" class="combo-dropdown">
              <view v-for="item in comboOptions('local_categories')" :key="item" class="combo-item" @tap.stop="selectCombo('local_categories', item)">{{ item }}</view>
            </view>
          </view>
        </view>
        <view class="form-item half">
          <text class="form-label">工厂</text>
          <view class="combo-wrap">
            <input v-model="form.factoryName" class="combo-input" placeholder="输入工厂名" placeholder-class="placeholder" @focus="comboOpenKey = 'local_factories'" @blur="comboBlur('local_factories')" />
            <view class="combo-arrow" @tap.stop="toggleCombo('local_factories')"><text :class="['combo-arrow-text', comboOpenKey === 'local_factories' ? 'open' : '']">▼</text></view>
            <view v-if="comboOpenKey === 'local_factories' && comboOptions('local_factories').length > 0" class="combo-dropdown">
              <view v-for="item in comboOptions('local_factories')" :key="item" class="combo-item" @tap.stop="selectCombo('local_factories', item)">{{ item }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 理单 + 跟单 -->
      <view class="form-row">
        <view class="form-item half">
          <text class="form-label">理单</text>
          <view class="combo-wrap">
            <input v-model="form.coordinatorName" class="combo-input" placeholder="输入理单人" placeholder-class="placeholder" @focus="comboOpenKey = 'local_coordinators'" @blur="comboBlur('local_coordinators')" />
            <view class="combo-arrow" @tap.stop="toggleCombo('local_coordinators')"><text :class="['combo-arrow-text', comboOpenKey === 'local_coordinators' ? 'open' : '']">▼</text></view>
            <view v-if="comboOpenKey === 'local_coordinators' && comboOptions('local_coordinators').length > 0" class="combo-dropdown">
              <view v-for="item in comboOptions('local_coordinators')" :key="item" class="combo-item" @tap.stop="selectCombo('local_coordinators', item)">{{ item }}</view>
            </view>
          </view>
        </view>
        <view class="form-item half">
          <text class="form-label">跟单</text>
          <view class="combo-wrap">
            <input v-model="form.merchandiserName" class="combo-input" placeholder="输入跟单人" placeholder-class="placeholder" @focus="comboOpenKey = 'local_merchandisers'" @blur="comboBlur('local_merchandisers')" />
            <view class="combo-arrow" @tap.stop="toggleCombo('local_merchandisers')"><text :class="['combo-arrow-text', comboOpenKey === 'local_merchandisers' ? 'open' : '']">▼</text></view>
            <view v-if="comboOpenKey === 'local_merchandisers' && comboOptions('local_merchandisers').length > 0" class="combo-dropdown">
              <view v-for="item in comboOptions('local_merchandisers')" :key="item" class="combo-item" @tap.stop="selectCombo('local_merchandisers', item)">{{ item }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 图片上传 -->
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

      <!-- 备注 -->
      <view class="form-item">
        <text class="form-label">备注</text>
        <textarea v-model="form.remark" class="form-textarea" placeholder="订单备注..." placeholder-class="placeholder" />
      </view>
    </view>

    <!-- ========== 颜色尺码矩阵 ========== -->
    <view class="card">
      <view class="card-title">
        <text>颜色尺码矩阵</text>
        <text class="card-subtitle">总数量: {{ totalQty }} 件</text>
      </view>

      <!-- 颜色输入 -->
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
            <input :value="newColor" class="tag-input" placeholder="输入颜色名称" placeholder-class="placeholder" @input="onColorInput" @confirm="addColor" />
            <view class="add-btn" @tap="addColor"><text class="add-btn-text">添加</text></view>
          </view>
        </view>
      </view>

      <!-- 尺码输入 -->
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
            <input :value="newSize" class="tag-input" placeholder="输入尺码名称" placeholder-class="placeholder" @input="onSizeInput" @confirm="addSize" />
            <view class="add-btn" @tap="addSize"><text class="add-btn-text">添加</text></view>
          </view>
        </view>
      </view>

      <!-- 矩阵表格 -->
      <view v-if="colors.length > 0 && sizes.length > 0" class="matrix-wrapper">
        <scroll-view scroll-x class="matrix-scroll" show-scrollbar="false">
          <view class="matrix-table">
            <view class="matrix-row matrix-header">
              <view class="matrix-cell matrix-corner">颜色\尺码</view>
              <view v-for="size in sizes" :key="size" class="matrix-cell matrix-size-header">{{ size }}</view>
              <view class="matrix-cell matrix-total-header">小计</view>
            </view>
            <view v-for="color in colors" :key="color" class="matrix-row">
              <view class="matrix-cell matrix-color-cell">{{ color }}</view>
              <view v-for="size in sizes" :key="size" class="matrix-cell matrix-input-cell">
                <input :value="getMatrixValue(color, size)" class="matrix-input" type="number" placeholder="0" placeholder-class="placeholder" @input="onMatrixInput(color, size, $event)" />
              </view>
              <view class="matrix-cell matrix-total-cell">{{ getColorTotal(color) }}</view>
            </view>
            <view class="matrix-row matrix-footer">
              <view class="matrix-cell matrix-color-cell">合计</view>
              <view v-for="size in sizes" :key="size" class="matrix-cell matrix-size-total">{{ getSizeTotal(size) }}</view>
              <view class="matrix-cell matrix-grand-total">{{ totalQty }}</view>
            </view>
          </view>
        </scroll-view>
      </view>

      <view v-if="colors.length > 0 && sizes.length > 0" class="quick-actions">
        <view class="quick-btn" @tap="fillAllEqual"><text>均分数量</text></view>
        <view class="quick-btn" @tap="clearMatrix"><text>清空矩阵</text></view>
      </view>
    </view>

    <!-- 提交 -->
    <view class="submit-area">
      <button class="btn-cancel" @tap="handleCancel">取消</button>
      <button class="btn-submit" :disabled="submitting" @tap="handleSubmit">{{ submitting ? '保存中...' : (isEdit ? '保存修改' : '创建订单') }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createOrder, updateOrder, getOrderDetail } from '../../api/orders';
import { uploadFile } from '../../utils/request';
import type { CreateOrderPayload } from '../../api/orders';

// ========== 编辑模式 ==========
const isEdit = ref(false);
const orderId = ref(0);

// ========== 组合输入组件 ==========
// 自由输入 + 历史下拉选择，新值自动保存到 localStorage
const comboOpenKey = ref(''); // 当前展开的下拉框 storageKey

function loadLocalOptions(key: string): string[] {
  try { return uni.getStorageSync(key) || []; } catch { return []; }
}
function saveLocalOption(key: string, value: string) {
  const v = value.trim();
  if (!v) return;
  const list: string[] = loadLocalOptions(key);
  if (!list.includes(v)) {
    list.unshift(v);
    if (list.length > 20) list.pop();
    try { uni.setStorageSync(key, list); } catch { /* ignore */ }
  }
}
function selectCombo(key: string, value: string) {
  const kv = key as keyof typeof form;
  (form as any)[kv] = value;
  comboOpenKey.value = '';
}
function toggleCombo(key: string) {
  comboOpenKey.value = comboOpenKey.value === key ? '' : key;
}
function comboBlur(key: string) {
  // 延迟关闭，让下拉选项的 @tap 有机会执行
  setTimeout(() => {
    if (comboOpenKey.value === key) comboOpenKey.value = '';
  }, 200);
}
function comboOptions(key: string): string[] {
  const list = loadLocalOptions(key);
  const current = (form as any)[key.replace('local_', '')] as string;
  return list.filter(v => !current || v !== current.trim());
}

// ========== 调试状态 ==========
const submitStatus = ref('就绪');

// ========== 表单数据 ==========
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
const matrixData = ref<Record<string, number>>({});

const submitting = ref(false);

const totalQty = computed(() =>
  Object.values(matrixData.value).reduce((sum, n) => sum + (n || 0), 0)
);

// ========== 矩阵操作 ==========
function getMatrixValue(color: string, size: string): string {
  return String(matrixData.value[`${color}|${size}`] || '');
}
function onMatrixInput(color: string, size: string, e: any) {
  matrixData.value[`${color}|${size}`] = parseInt(e.detail.value) || 0;
}
function getColorTotal(color: string): number {
  return sizes.value.reduce((sum, size) => sum + (matrixData.value[`${color}|${size}`] || 0), 0);
}
function getSizeTotal(size: string): number {
  return colors.value.reduce((sum, color) => sum + (matrixData.value[`${color}|${size}`] || 0), 0);
}

function onColorInput(e: any) { newColor.value = e.detail.value; }
function onSizeInput(e: any) { newSize.value = e.detail.value; }

function addColor() {
  const v = newColor.value.trim();
  if (!v) { uni.showToast({ title: '请输入颜色名称', icon: 'none' }); return; }
  if (colors.value.includes(v)) { uni.showToast({ title: '该颜色已存在', icon: 'none' }); return; }
  colors.value.push(v);
  newColor.value = '';
}
function removeColor(idx: number) {
  const color = colors.value[idx];
  colors.value.splice(idx, 1);
  sizes.value.forEach(s => delete matrixData.value[`${color}|${s}`]);
}
function addSize() {
  const v = newSize.value.trim();
  if (!v) { uni.showToast({ title: '请输入尺码名称', icon: 'none' }); return; }
  if (sizes.value.includes(v)) { uni.showToast({ title: '该尺码已存在', icon: 'none' }); return; }
  sizes.value.push(v);
  newSize.value = '';
}
function removeSize(idx: number) {
  const size = sizes.value[idx];
  sizes.value.splice(idx, 1);
  colors.value.forEach(c => delete matrixData.value[`${c}|${size}`]);
}
function fillAllEqual() {
  uni.showModal({
    title: '均分数量',
    content: '请输入每个颜色尺码的数量',
    editable: true,
    placeholderText: '如: 100',
    success: (res) => {
      if (res.confirm) {
        const qty = parseInt(res.content) || 0;
        colors.value.forEach(c => sizes.value.forEach(s => { matrixData.value[`${c}|${s}`] = qty; }));
      }
    },
  });
}
function clearMatrix() { matrixData.value = {}; }

// ========== 图片 ==========
function onDateChange(e: any) { form.deliveryDate = e.detail.value; }

/** 编辑模式：加载订单详情填充表单 */
async function loadOrderForEdit(id: number) {
  try {
    const detail = await getOrderDetail(id);
    form.orderNo = detail.orderNo;
    form.customerName = detail.customer?.customerName || '';
    form.styleNo = detail.styleNo;
    form.styleName = detail.styleName || '';
    form.season = detail.season || '';
    form.category = detail.category || '';
    form.garmentImageUrl = detail.garmentImageUrl || '';
    form.deliveryDate = detail.deliveryDate || '';
    form.factoryName = detail.assignedFactory?.factoryName || '';
    form.coordinatorName = detail.coordinatorName || '';
    form.merchandiserName = detail.merchandiserName || '';
    form.remark = detail.remark || '';

    // 颜色/尺码/矩阵
    colors.value = [...new Set(detail.colorSizes.map((cs) => cs.color))];
    sizes.value = [...new Set(detail.colorSizes.map((cs) => cs.size))];
    const matrix: Record<string, number> = {};
    detail.colorSizes.forEach((cs) => {
      matrix[`${cs.color}|${cs.size}`] = cs.quantity;
    });
    matrixData.value = matrix;

    uni.setNavigationBarTitle({ title: '编辑订单' });
  } catch (err: any) {
    uni.showToast({ title: '加载订单失败: ' + (err.message || ''), icon: 'none' });
    setTimeout(() => uni.navigateBack(), 1200);
  }
}

onLoad((options: any) => {
  if (options.id) {
    isEdit.value = true;
    orderId.value = Number(options.id);
    loadOrderForEdit(orderId.value);
  } else {
    uni.setNavigationBarTitle({ title: '创建订单' });
  }
});

async function uploadImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' });
        const result = await uploadFile('/files/upload/garment-image', res.tempFilePaths[0], 'file');
        form.garmentImageUrl = result.fileUrl;
        uni.showToast({ title: '上传成功', icon: 'success' });
      } catch (err: any) {
        uni.showToast({ title: '上传失败: ' + err.message, icon: 'none' });
      } finally { uni.hideLoading(); }
    },
  });
}

// ========== 提交 ==========
async function handleSubmit() {
  if (!form.orderNo.trim()) { uni.showToast({ title: '请输入订单号', icon: 'none' }); return; }
  if (!form.customerName.trim()) { uni.showToast({ title: '请输入客户', icon: 'none' }); return; }
  if (!form.styleNo.trim()) { uni.showToast({ title: '请输入款号', icon: 'none' }); return; }
  if (!form.deliveryDate) { uni.showToast({ title: '请选择交期', icon: 'none' }); return; }
  if (colors.value.length === 0 || sizes.value.length === 0) { uni.showToast({ title: '请至少添加一个颜色和尺码', icon: 'none' }); return; }
  if (totalQty.value === 0) { uni.showToast({ title: '请录入颜色尺码数量', icon: 'none' }); return; }

  submitting.value = true;
  submitStatus.value = '提交中...';
  try {
    const colorSizes: any[] = [];
    colors.value.forEach((color, ci) => {
      sizes.value.forEach((size, si) => {
        const qty = matrixData.value[`${color}|${size}`] || 0;
        if (qty > 0) colorSizes.push({ color, size, quantity: qty, sortOrder: ci * 100 + si });
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

    if (isEdit.value) {
      // 编辑模式：更新基础信息 + 矩阵
      await updateOrder(orderId.value, payload);
      submitStatus.value = '成功!';
      uni.showToast({ title: '订单已更新', icon: 'success' });
      uni.$emit('orderUpdated');
      setTimeout(() => uni.navigateBack(), 1500);
      return;
    }

    await createOrder(payload);
    submitStatus.value = '成功!';

    // 自动保存历史输入
    saveLocalOption('local_customers', form.customerName);
    saveLocalOption('local_categories', form.category);
    saveLocalOption('local_factories', form.factoryName);
    saveLocalOption('local_coordinators', form.coordinatorName);
    saveLocalOption('local_merchandisers', form.merchandiserName);

    uni.showToast({ title: '订单创建成功', icon: 'success' });
    uni.$emit('orderCreated');
    setTimeout(() => uni.navigateBack(), 1500);
  } catch (err: any) {
    submitStatus.value = '失败: ' + (err.message || '未知');
    uni.showToast({ title: '创建失败: ' + (err.message || '未知错误'), icon: 'none', duration: 3000 });
  } finally { submitting.value = false; }
}

function handleCancel() { uni.navigateBack(); }
</script>

<style scoped>
.create-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 140rpx; }

.debug-bar { padding: 6rpx 20rpx; background: #FFF8E1; border-bottom: 1rpx solid #FFE082; }
.debug-text { font-size: 20rpx; color: #854F0B; }

.card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin: 20rpx; }
.card-title { font-size: 30rpx; font-weight: 600; color: #2C2C2A; margin-bottom: 20rpx; padding-bottom: 12rpx; border-bottom: 1rpx solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.card-subtitle { font-size: 24rpx; font-weight: 400; color: #0F6E56; }

.form-item { margin-bottom: 20rpx; position: relative; }
.form-item.half { flex: 1; }
.form-row { display: flex; gap: 20rpx; }
.form-label { display: block; font-size: 26rpx; color: #5F5E5A; margin-bottom: 8rpx; }
.form-label.required::after { content: ' *'; color: #A32D2D; }
.form-input { width: 100%; height: 72rpx; padding: 0 20rpx; background: #F8F8F6; border-radius: 10rpx; font-size: 28rpx; color: #2C2C2A; border: 1rpx solid #E0E0E0; box-sizing: border-box; }
.form-textarea { width: 100%; min-height: 120rpx; padding: 16rpx 20rpx; background: #F8F8F6; border-radius: 10rpx; font-size: 28rpx; color: #2C2C2A; border: 1rpx solid #E0E0E0; box-sizing: border-box; }
.form-picker { display: flex; justify-content: space-between; align-items: center; height: 72rpx; padding: 0 20rpx; background: #F8F8F6; border-radius: 10rpx; border: 1rpx solid #E0E0E0; font-size: 28rpx; color: #2C2C2A; }
.picker-arrow { color: #B4B2A9; font-size: 28rpx; }
.placeholder { color: #B4B2A9; }

/* 组合输入框 */
.combo-wrap { position: relative; }
.combo-input { width: 100%; height: 72rpx; padding: 0 60rpx 0 20rpx; background: #F8F8F6; border-radius: 10rpx; font-size: 28rpx; color: #2C2C2A; border: 1rpx solid #E0E0E0; box-sizing: border-box; }
.combo-arrow { position: absolute; right: 16rpx; top: 0; height: 72rpx; display: flex; align-items: center; justify-content: center; width: 40rpx; z-index: 2; }
.combo-arrow-text { font-size: 22rpx; color: #B4B2A9; transition: transform 0.2s; }
.combo-arrow-text.open { transform: rotate(180deg); }
.combo-dropdown { position: absolute; left: 0; right: 0; top: 72rpx; background: #fff; border: 1rpx solid #E0E0E0; border-radius: 0 0 10rpx 10rpx; max-height: 240rpx; overflow-y: auto; z-index: 50; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.combo-item { padding: 16rpx 20rpx; font-size: 26rpx; color: #2C2C2A; border-bottom: 1rpx solid #f5f5f5; }
.combo-item:last-child { border-bottom: none; }
.combo-item:active { background: #E6F1FB; }

/* 图片 */
.image-upload-area { display: flex; align-items: center; }
.image-preview { position: relative; width: 200rpx; height: 200rpx; border-radius: 12rpx; overflow: hidden; border: 1rpx solid #E0E0E0; }
.preview-img { width: 100%; height: 100%; }
.remove-img { position: absolute; top: 4rpx; right: 8rpx; color: #fff; font-size: 24rpx; background: rgba(0,0,0,0.5); border-radius: 50%; width: 36rpx; height: 36rpx; display: flex; align-items: center; justify-content: center; }
.upload-btn { width: 200rpx; height: 200rpx; border: 2rpx dashed #C0C0C0; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx; }
.upload-icon { font-size: 48rpx; color: #B4B2A9; }
.upload-text { font-size: 24rpx; color: #B4B2A9; }

/* 颜色尺码 */
.tag-input-area { display: flex; flex-direction: column; gap: 12rpx; }
.tag-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.input-tag { display: flex; align-items: center; gap: 8rpx; padding: 8rpx 16rpx; background: #E6F1FB; color: #185FA5; border-radius: 8rpx; font-size: 24rpx; }
.tag-remove { display: flex; align-items: center; justify-content: center; width: 32rpx; height: 32rpx; border-radius: 50%; background: rgba(24,95,165,0.15); font-size: 22rpx; }
.tag-add-row { display: flex; gap: 12rpx; align-items: center; }
.tag-input { flex: 1; height: 64rpx; padding: 0 20rpx; background: #F8F8F6; border-radius: 8rpx; border: 1rpx solid #E0E0E0; font-size: 26rpx; }
.add-btn { padding: 0 28rpx; height: 64rpx; background: #185FA5; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; }
.add-btn-text { color: #fff; font-size: 26rpx; }

/* 矩阵 */
.matrix-wrapper { margin-top: 12rpx; border-radius: 8rpx; overflow: hidden; }
.matrix-scroll { width: 100%; white-space: nowrap; }
.matrix-table { display: inline-block; min-width: 100%; border: 1rpx solid #E0E0E0; border-radius: 8rpx; }
.matrix-row { display: flex; border-bottom: 1rpx solid #f0f0f0; }
.matrix-row:last-child { border-bottom: none; }
.matrix-cell { flex-shrink: 0; text-align: center; padding: 12rpx 2rpx; font-size: 24rpx; border-right: 1rpx solid #f0f0f0; min-height: 56rpx; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.matrix-cell:last-child { border-right: none; }
.matrix-corner { font-weight: 600; color: #5F5E5A; width: 140rpx; min-width: 140rpx; font-size: 22rpx; }
.matrix-color-cell { font-weight: 500; color: #2C2C2A; width: 140rpx; min-width: 140rpx; }
.matrix-size-header { font-weight: 600; color: #5F5E5A; width: 100rpx; min-width: 100rpx; }
.matrix-input-cell { width: 100rpx; min-width: 100rpx; padding: 4rpx 2rpx; }
.matrix-total-header { font-weight: 600; color: #0F6E56; background: #E1F5EE; width: 110rpx; min-width: 110rpx; }
.matrix-total-cell { background: #F0FBF7; font-weight: 600; color: #0F6E56; width: 110rpx; min-width: 110rpx; }
.matrix-footer { background: #F1EFE8; }
.matrix-footer .matrix-cell { font-weight: 600; }
.matrix-size-total { color: #5F5E5A; width: 100rpx; min-width: 100rpx; }
.matrix-grand-total { background: #E1F5EE; color: #0F6E56; font-weight: 700; font-size: 28rpx; width: 110rpx; min-width: 110rpx; }
.matrix-input { width: 100%; height: 56rpx; text-align: center; font-size: 24rpx; color: #2C2C2A; background: transparent; border: none; }

.quick-actions { display: flex; gap: 16rpx; margin-top: 16rpx; }
.quick-btn { padding: 8rpx 20rpx; background: #F1EFE8; color: #5F5E5A; border-radius: 8rpx; font-size: 24rpx; }

/* 提交 */
.submit-area { position: fixed; bottom: 0; left: 0; right: 0; display: flex; gap: 20rpx; padding: 20rpx 30rpx; background: #fff; border-top: 1rpx solid #E0E0E0; z-index: 100; }
.btn-cancel { flex: 1; height: 80rpx; line-height: 80rpx; background: #F1EFE8; color: #5F5E5A; border-radius: 12rpx; font-size: 28rpx; border: none; }
.btn-submit { flex: 2; height: 80rpx; line-height: 80rpx; background: #185FA5; color: #fff; border-radius: 12rpx; font-size: 28rpx; border: none; }
.btn-submit[disabled] { opacity: 0.6; }
</style>
