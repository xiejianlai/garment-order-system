<!--
  订单详情页 — 小程序 + H5 双端

  包含 4 个 Tab:
  1. 基础信息: 订单信息 + 颜色尺码矩阵
  2. 物料进度: 物料清单 + 面料信息 + 齐套状态
  3. T&A进度: 13个阶段状态（支持计划/实际时间填写）
  4. 操作日志: 变更日志流
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

        <!-- 物料齐套 & T&A 进度速览 -->
        <view class="summary-badges">
          <view class="badge" :class="(order.trimsSummary?.allReady) ? 'badge-green' : 'badge-amber'">
            <text>物料齐套 {{ order.trimsSummary?.ready || 0 }}/{{ order.trimsSummary?.total || 0 }}</text>
          </view>
          <view class="badge" :class="(order.taSummary?.delayed || 0) > 0 ? 'badge-red' : 'badge-blue'">
            <text>T&A进度 {{ order.taSummary?.completed || 0 }}/{{ order.taSummary?.total || 0 }}</text>
          </view>
          <view v-if="(order.taSummary?.delayed || 0) > 0" class="badge badge-red">
            <text>延误 {{ order.taSummary.delayed }}项</text>
          </view>
        </view>

        <!-- 管理操作区（编辑/状态/可见性/删除） -->
        <view v-if="canEditBaseInfo || canDelete || canSetVisibility" class="summary-actions">
          <view v-if="canEditBaseInfo" class="action-btn" @tap="goEditOrder"><text>编辑订单</text></view>
          <view v-if="canChangeStatus" class="action-btn" @tap="openStatusModal"><text>修改状态</text></view>
          <view v-if="canSetVisibility" class="action-btn" @tap="openVisibilityModal"><text>可见性设置</text></view>
          <view v-if="canDelete" class="action-btn action-danger" @tap="confirmDeleteOrder"><text>删除订单</text></view>
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
            <view class="info-row" v-if="order.coordinator">
              <text class="info-label">理单员</text>
              <text class="info-value">{{ order.coordinator.realName }}</text>
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

          <!-- 颜色尺码矩阵 — 横向可滚动 -->
          <view class="card">
            <view class="card-title">颜色尺码矩阵</view>
            <view class="matrix-wrapper">
              <scroll-view scroll-x class="matrix-scroll" show-scrollbar="false">
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
                      class="matrix-cell matrix-qty-cell"
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
                      class="matrix-cell matrix-size-total"
                    >
                      {{ getSizeTotal(size) }}
                    </view>
                    <view class="matrix-cell matrix-grand-total">{{ order.totalQty }}</view>
                  </view>
                </view>
              </scroll-view>
            </view>
          </view>
        </view>

        <!-- ========== Tab 2: 物料进度 ========== -->
        <view v-if="activeTab === 'trims'" class="tab-panel">
          <!-- 面料信息卡片（可编辑） -->
          <view class="card">
            <view class="card-title-row">
              <text class="card-title-inline">面料信息</text>
              <view v-if="canManageFabric" class="trim-manage-btn" @tap="openFabricModal(null)">
                <text>{{ order.fabrics?.length ? '编辑' : '添加面料' }}</text>
              </view>
            </view>
            <view v-if="order.fabrics && order.fabrics.length > 0">
              <view v-for="fabric in order.fabrics" :key="fabric.id" class="fabric-item">
                <view class="info-row">
                  <text class="info-label">品名</text>
                  <text class="info-value">{{ fabric.fabricName || '-' }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">颜色</text>
                  <text class="info-value">{{ fabric.color || '-' }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">订单数量</text>
                  <text class="info-value">{{ fabric.totalDemand ?? '-' }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">供应商</text>
                  <text class="info-value">{{ fabric.supplierName || '-' }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">下单日期</text>
                  <text class="info-value">{{ fabric.orderDate ? formatDate(fabric.orderDate) : '-' }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">计划完成</text>
                  <text class="info-value">{{ fabric.plannedDate ? formatDate(fabric.plannedDate) : '-' }}</text>
                </view>
              </view>
            </view>
            <view v-else class="empty-text">暂无面料信息</view>
          </view>

          <!-- 齐套状态卡片 -->
          <view class="card">
            <view class="card-title-row">
              <text class="card-title-inline">物料齐套状态</text>
              <view
                v-if="canManageThisOrderTrims"
                class="trim-manage-btn"
                @tap="goTrimManage"
              >
                <text>管理物料</text>
              </view>
            </view>
            <view class="trims-ready-banner" :class="(order.trimsSummary?.allReady) ? 'banner-green' : 'banner-amber'">
              <text class="banner-text">
                {{ order.trimsSummary?.allReady ? '全部物料已齐套' : `物料齐套中 ${order.trimsSummary?.ready || 0}/${order.trimsSummary?.total || 0}` }}
              </text>
              <view
                v-if="canManageThisOrderTrims"
                class="banner-action"
                @tap="handleCheckTrimsReady"
              >
                <text>刷新检查</text>
              </view>
            </view>
          </view>

          <!-- 物料列表 -->
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
                <text class="info-value">{{ trim.usagePerPiece }} {{ trim.unit }}/件 x {{ order.totalQty }}件 = {{ trim.totalDemand }} {{ trim.unit }}</text>
              </view>
              <view class="info-row" v-if="trim.totalQty">
                <text class="info-label">总数量</text>
                <text class="info-value">{{ trim.totalQty }} {{ trim.unit }}</text>
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
                <view class="step-arrow">></view>
                <view class="step" :class="['in_sampling','sent_for_approval','approved','rejected'].includes(trim.samplingStatus) ? 'step-active' : ''">
                  <text>打样中</text>
                </view>
                <view class="step-arrow">></view>
                <view class="step" :class="['sent_for_approval','approved'].includes(trim.samplingStatus) ? 'step-active' : ''">
                  <text>寄客批</text>
                </view>
                <view class="step-arrow">></view>
                <view class="step" :class="trim.samplingStatus === 'approved' ? 'step-done' : ''">
                  <text>已确认</text>
                </view>
              </view>
              <!-- 打样时间 -->
              <view class="dates-row" v-if="trim.samplingSentDate || trim.samplingApprovedDate">
                <text v-if="trim.samplingSentDate" class="date-text">寄出: {{ formatDate(trim.samplingSentDate) }}</text>
                <text v-if="trim.samplingApprovedDate" class="date-text">确认: {{ formatDate(trim.samplingApprovedDate) }}</text>
              </view>
            </view>

            <!-- 大货阶段 -->
            <view class="trim-section">
              <text class="section-title">大货阶段</text>
              <view class="trim-steps">
                <view class="step" :class="['ordered','producing','shipped','received'].includes(trim.bulkPoStatus) ? 'step-active' : ''">
                  <text>已下单</text>
                </view>
                <view class="step-arrow">></view>
                <view class="step" :class="trim.bulkEtd ? 'step-active' : ''">
                  <text>预计到厂 {{ trim.bulkEtd ? formatDate(trim.bulkEtd) : '-' }}</text>
                </view>
                <view class="step-arrow">></view>
                <view class="step" :class="trim.bulkEta ? 'step-active' : ''">
                  <text>实际到厂 {{ trim.bulkEta ? formatDate(trim.bulkEta) : '-' }}</text>
                </view>
                <view class="step-arrow">></view>
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

          <view v-if="order.trims.length === 0" class="empty-text">暂无物料记录</view>
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
                <!-- 按角色权限显示更新按钮（理单全部/跟单不含出货/工厂仅大货/管理员全部） -->
                <view
                  v-if="canUpdateStage(stage)"
                  class="ta-update-btn"
                  @tap="showStageUpdate(stage)"
                >
                  <text>更新</text>
                </view>
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

    <!-- ========== T&A 阶段更新弹窗 ========== -->
    <view v-if="showStageModal" class="modal-mask" @tap="showStageModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">更新进度 - {{ editingStage?.stageName }}</text>
          <view class="modal-close" @tap="showStageModal = false"><text>x</text></view>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label required">状态</text>
            <picker mode="selector" :range="statusOptions" :range-key="'label'" @change="onStatusChange">
              <view class="form-picker">
                <text>{{ statusLabel || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">计划时间</text>
            <picker mode="date" :value="stageUpdate.plannedDate" @change="(e: any) => stageUpdate.plannedDate = e.detail.value">
              <view class="form-picker">
                <text :class="{ placeholder: !stageUpdate.plannedDate }">{{ stageUpdate.plannedDate || '选择日期' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">实际时间</text>
            <picker mode="date" :value="stageUpdate.actualDate" @change="(e: any) => stageUpdate.actualDate = e.detail.value">
              <view class="form-picker">
                <text :class="{ placeholder: !stageUpdate.actualDate }">{{ stageUpdate.actualDate || '选择日期' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">完成度(%)</text>
            <input
              :value="String(stageUpdate.completionPct || 0)"
              class="form-input"
              type="number"
              placeholder="0-100"
              placeholder-class="placeholder"
              @input="(e: any) => stageUpdate.completionPct = parseInt(e.detail.value) || 0"
            />
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <textarea
              v-model="stageUpdate.remark"
              class="form-textarea"
              placeholder="进度备注..."
              placeholder-class="placeholder"
            />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @tap="showStageModal = false">取消</button>
          <button class="btn-submit" @tap="handleStageUpdate">保存</button>
        </view>
      </view>
    </view>

    <!-- ========== 订单状态修改弹窗 ========== -->
    <view v-if="showStatusModal" class="modal-mask" @tap="showStatusModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">修改订单状态</text>
          <view class="modal-close" @tap="showStatusModal = false"><text>x</text></view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label required">订单状态</text>
            <picker mode="selector" :range="orderStatusOptions" :range-key="'label'" @change="onOrderStatusChange">
              <view class="form-picker">
                <text>{{ orderStatusLabel || '请选择' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @tap="showStatusModal = false">取消</button>
          <button class="btn-submit" @tap="handleStatusUpdate">保存</button>
        </view>
      </view>
    </view>

    <!-- ========== 可见性设置弹窗（管理员） ========== -->
    <view v-if="showVisibilityModal" class="modal-mask" @tap="showVisibilityModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">订单可见性设置</text>
          <view class="modal-close" @tap="showVisibilityModal = false"><text>x</text></view>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label required">可见范围</text>
            <picker mode="selector" :range="visibilityOptions" :range-key="'label'" @change="onVisibilityModeChange">
              <view class="form-picker">
                <text>{{ visibilityModeLabel }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view v-if="visibilityForm.visibility === 'restricted'" class="form-item">
            <text class="form-label">额外授权可见的成员</text>
            <view v-if="companyMembers.length === 0" class="empty-text">暂无可选成员</view>
            <view v-for="member in companyMembers" :key="member.id" class="member-check-row" @tap="toggleMember(member.id)">
              <text class="member-check-name">{{ member.realName }}（{{ ROLE_LABELS[member.role] }}）</text>
              <text class="member-check-box" :class="{ checked: isMemberChecked(member.id) }">{{ isMemberChecked(member.id) ? '✓' : '' }}</text>
            </view>
          </view>
          <view v-else class="hint-text">选择"公司全员"后，公司内所有成员均可查看此订单。</view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @tap="showVisibilityModal = false">取消</button>
          <button class="btn-submit" @tap="handleVisibilityUpdate">保存</button>
        </view>
      </view>
    </view>

    <!-- ========== 面料编辑弹窗 ========== -->
    <view v-if="showFabricModal" class="modal-mask" @tap="showFabricModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ fabricModal.id ? '编辑面料' : '添加面料' }}</text>
          <view class="modal-close" @tap="showFabricModal = false"><text>x</text></view>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view class="form-item">
            <text class="form-label required">面料品名</text>
            <input v-model="fabricModal.fabricName" class="form-input" placeholder="如: 全棉汗布" placeholder-class="placeholder" />
          </view>
          <view class="form-item">
            <text class="form-label">颜色</text>
            <input v-model="fabricModal.color" class="form-input" placeholder="如: 藏青" placeholder-class="placeholder" />
          </view>
          <view class="form-item">
            <text class="form-label">订单数量</text>
            <input :value="String(fabricModal.totalDemand ?? '')" class="form-input" type="number" placeholder="如: 5000" placeholder-class="placeholder" @input="(e: any) => fabricModal.totalDemand = parseInt(e.detail.value) || 0" />
          </view>
          <view class="form-item">
            <text class="form-label">供应商名字</text>
            <input v-model="fabricModal.supplierName" class="form-input" placeholder="如: 某某纺织" placeholder-class="placeholder" />
          </view>
          <view class="form-item">
            <text class="form-label">下单日期</text>
            <picker mode="date" :value="fabricModal.orderDate" @change="(e: any) => fabricModal.orderDate = e.detail.value">
              <view class="form-picker">
                <text :class="{ placeholder: !fabricModal.orderDate }">{{ fabricModal.orderDate || '选择日期' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">计划完成日期</text>
            <picker mode="date" :value="fabricModal.plannedDate" @change="(e: any) => fabricModal.plannedDate = e.detail.value">
              <view class="form-picker">
                <text :class="{ placeholder: !fabricModal.plannedDate }">{{ fabricModal.plannedDate || '选择日期' }}</text>
                <text class="picker-arrow">></text>
              </view>
            </picker>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-cancel" @tap="showFabricModal = false">取消</button>
          <button class="btn-submit" @tap="handleFabricSave">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import {
  getOrderDetail, updateTaStage, checkTrimsReady,
  updateOrderStatus, deleteOrder, updateOrderVisibility,
  addFabric, updateFabric,
} from '../../api/orders';
import { getCompanyInfo } from '../../api/company';
import type { MemberInfo } from '../../api/company';
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
    { key: 'trims', label: '物料进度' },
    { key: 'ta', label: 'T&A进度' },
    { key: 'logs', label: '操作日志' },
  ];
  if (userStore.isCustomer) {
    return tabs.filter((t) => t.key !== 'logs');
  }
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

/** ========== 权限计算属性 ========== */
/** 当前用户是否为该订单的负责理单 */
function isOrderCoordinator(): boolean {
  const me = userStore.userInfo;
  if (!me || !order.value) return false;
  return Number(order.value.coordinator?.id) === Number(me.id) ||
    (!order.value.coordinatorRegistered && order.value.coordinatorName === me.realName);
}
/** 当前用户是否为该订单的负责跟单 */
function isOrderMerchandiser(): boolean {
  const me = userStore.userInfo;
  if (!me || !order.value) return false;
  return Number(order.value.merchandiser?.id) === Number(me.id) ||
    (!order.value.merchandiserRegistered && order.value.merchandiserName === me.realName);
}
/** 可编辑基础信息 / 修改状态（管理员或该订单负责理单） */
const canEditBaseInfo = computed(() => userStore.isAdmin || (userStore.isCoordinator && isOrderCoordinator()));
const canChangeStatus = computed(() => canEditBaseInfo.value);
/** 可删除订单（仅管理员） */
const canDelete = computed(() => userStore.isAdmin);
/** 可设置可见性（仅管理员） */
const canSetVisibility = computed(() => userStore.isAdmin);
/** 可管理面料（管理员或该订单负责理单） */
const canManageFabric = computed(() => userStore.isAdmin || (userStore.isCoordinator && isOrderCoordinator()));
/** 可管理该订单物料（管理员或该订单负责理单） */
const canManageThisOrderTrims = computed(() => userStore.isAdmin || (userStore.isCoordinator && isOrderCoordinator()));

/** T&A 阶段更新权限：管理员全部；理单全部（负责人）；跟单非出货（负责人）；工厂仅大货 */
function canUpdateStage(stage: OrderTaStage): boolean {
  if (userStore.isFactory) return stage.stageCategory === 'production';
  if (userStore.isAdmin) return true;
  if (userStore.isCoordinator) return isOrderCoordinator();
  if (userStore.isMerchandiser) {
    if (stage.stageCategory === 'shipping') return false;
    return isOrderMerchandiser();
  }
  return false;
}

/** 物料状态映射 */
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

/** T&A 阶段更新弹窗 */
const showStageModal = ref(false);
const editingStage = ref<OrderTaStage | null>(null);
const stageUpdate = reactive({
  status: '',
  plannedDate: '',
  actualDate: '',
  completionPct: 0,
  remark: '',
});
const statusOptions = [
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '延误' },
];
const statusLabel = computed(() =>
  statusOptions.find((s) => s.value === stageUpdate.status)?.label || '',
);

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

/** 跳转编辑订单（order-create 编辑模式） */
function goEditOrder() {
  uni.navigateTo({ url: `/pages/order-create/index?id=${orderId.value}` });
}

/** ========== 订单状态修改 ========== */
const showStatusModal = ref(false);
const orderStatusOptions = Object.keys(ORDER_STATUS_LABELS).map((value) => ({
  value,
  label: ORDER_STATUS_LABELS[value],
}));
const newStatus = ref<OrderStatus>(order.value?.orderStatus || 'confirmed');
const orderStatusLabel = computed(() => orderStatusOptions.find((s) => s.value === newStatus.value)?.label || '');

function openStatusModal() {
  newStatus.value = (order.value?.orderStatus || 'confirmed') as OrderStatus;
  showStatusModal.value = true;
}
function onOrderStatusChange(e: any) {
  newStatus.value = orderStatusOptions[e.detail.value].value as OrderStatus;
}
async function handleStatusUpdate() {
  if (!newStatus.value) return;
  try {
    await updateOrderStatus(orderId.value, newStatus.value);
    uni.showToast({ title: '状态已更新', icon: 'success' });
    showStatusModal.value = false;
    await loadOrderDetail();
  } catch (err: any) {
    uni.showToast({ title: '更新失败: ' + (err.message || '无权限'), icon: 'none' });
  }
}

/** ========== 删除订单（管理员） ========== */
function confirmDeleteOrder() {
  uni.showModal({
    title: '删除订单',
    content: `确定删除订单 ${order.value?.orderNo} 吗？删除后所有人将无法查看，操作将记录日志。`,
    confirmColor: '#A32D2D',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await deleteOrder(orderId.value);
        uni.showToast({ title: '订单已删除', icon: 'success' });
        uni.$emit('orderDeleted');
        setTimeout(() => uni.navigateBack(), 800);
      } catch (err: any) {
        uni.showToast({ title: '删除失败: ' + (err.message || ''), icon: 'none' });
      }
    },
  });
}

/** ========== 可见性设置（管理员） ========== */
const showVisibilityModal = ref(false);
const companyMembers = ref<MemberInfo[]>([]);
const visibilityOptions = [
  { value: 'restricted', label: '仅相关人员+授权成员' },
  { value: 'company', label: '公司全员可见' },
];
const visibilityForm = reactive({
  visibility: 'restricted' as 'restricted' | 'company',
  visibleUserIds: [] as number[],
});
const visibilityModeLabel = computed(() =>
  visibilityOptions.find((o) => o.value === visibilityForm.visibility)?.label || '',
);

async function openVisibilityModal() {
  try {
    if (companyMembers.value.length === 0) {
      const info = await getCompanyInfo();
      // 可选授权成员：理单/跟单/客户/工厂（不含管理员）
      companyMembers.value = (info.users || []).filter((u: any) => u.role !== 'admin' && u.status === 'active');
    }
    visibilityForm.visibility = order.value?.visibility || 'restricted';
    visibilityForm.visibleUserIds = [...(order.value?.visibleUserIds || [])];
    showVisibilityModal.value = true;
  } catch (err: any) {
    uni.showToast({ title: '加载成员失败', icon: 'none' });
  }
}
function onVisibilityModeChange(e: any) {
  visibilityForm.visibility = visibilityOptions[e.detail.value].value as 'restricted' | 'company';
}
function toggleMember(id: number) {
  const idx = visibilityForm.visibleUserIds.indexOf(id);
  if (idx >= 0) visibilityForm.visibleUserIds.splice(idx, 1);
  else visibilityForm.visibleUserIds.push(id);
}
function isMemberChecked(id: number): boolean {
  return visibilityForm.visibleUserIds.includes(id);
}
async function handleVisibilityUpdate() {
  try {
    await updateOrderVisibility(orderId.value, {
      visibility: visibilityForm.visibility,
      visibleUserIds: visibilityForm.visibleUserIds,
    });
    uni.showToast({ title: '可见性已更新', icon: 'success' });
    showVisibilityModal.value = false;
    await loadOrderDetail();
  } catch (err: any) {
    uni.showToast({ title: '更新失败: ' + (err.message || ''), icon: 'none' });
  }
}

/** ========== 面料编辑 ========== */
const showFabricModal = ref(false);
const fabricModal = reactive({
  id: 0,
  fabricName: '',
  color: '',
  totalDemand: 0 as number | undefined,
  supplierName: '',
  orderDate: '',
  plannedDate: '',
});

function openFabricModal(fabric: any) {
  if (fabric) {
    fabricModal.id = fabric.id;
    fabricModal.fabricName = fabric.fabricName || '';
    fabricModal.color = fabric.color || '';
    fabricModal.totalDemand = fabric.totalDemand ?? undefined;
    fabricModal.supplierName = fabric.supplierName || '';
    fabricModal.orderDate = fabric.orderDate || '';
    fabricModal.plannedDate = fabric.plannedDate || '';
  } else {
    fabricModal.id = 0;
    fabricModal.fabricName = '';
    fabricModal.color = '';
    fabricModal.totalDemand = undefined;
    fabricModal.supplierName = '';
    fabricModal.orderDate = '';
    fabricModal.plannedDate = '';
  }
  showFabricModal.value = true;
}

async function handleFabricSave() {
  if (!fabricModal.fabricName.trim()) {
    uni.showToast({ title: '请填写面料品名', icon: 'none' });
    return;
  }
  const payload = {
    fabricName: fabricModal.fabricName.trim(),
    color: fabricModal.color.trim() || undefined,
    totalDemand: fabricModal.totalDemand || 0,
    supplierName: fabricModal.supplierName.trim() || undefined,
    orderDate: fabricModal.orderDate || undefined,
    plannedDate: fabricModal.plannedDate || undefined,
  };
  try {
    if (fabricModal.id) {
      await updateFabric(orderId.value, fabricModal.id, payload);
    } else {
      await addFabric(orderId.value, payload);
    }
    uni.showToast({ title: '保存成功', icon: 'success' });
    showFabricModal.value = false;
    await loadOrderDetail();
  } catch (err: any) {
    uni.showToast({ title: '保存失败: ' + (err.message || ''), icon: 'none' });
  }
}

/** 显示阶段更新弹窗 */
function showStageUpdate(stage: OrderTaStage) {
  editingStage.value = stage;
  stageUpdate.status = stage.status;
  stageUpdate.plannedDate = stage.plannedDate ? formatDate(stage.plannedDate) : '';
  stageUpdate.actualDate = stage.actualDate ? formatDate(stage.actualDate) : '';
  stageUpdate.completionPct = stage.completionPct || 0;
  stageUpdate.remark = stage.remark || '';
  showStageModal.value = true;
}

function onStatusChange(e: any) {
  stageUpdate.status = statusOptions[e.detail.value].value;
}

async function handleStageUpdate() {
  if (!editingStage.value) return;
  try {
    const data: any = {
      status: stageUpdate.status,
      completionPct: stageUpdate.completionPct || 0,
    };
    if (stageUpdate.plannedDate) data.plannedDate = stageUpdate.plannedDate;
    if (stageUpdate.actualDate) data.actualDate = stageUpdate.actualDate;
    if (stageUpdate.remark) data.remark = stageUpdate.remark;

    await updateTaStage(orderId.value, editingStage.value.stageCode, data);
    uni.showToast({ title: '更新成功', icon: 'success' });
    showStageModal.value = false;
    await loadOrderDetail();
  } catch (err: any) {
    uni.showToast({ title: '更新失败', icon: 'none' });
  }
}

/** 一键检查物料齐套 */
async function handleCheckTrimsReady() {
  try {
    const result = await checkTrimsReady(orderId.value);
    if (result.allReady) {
      uni.showToast({ title: '所有物料已齐套', icon: 'success' });
    } else {
      const notReady = result.notReadyItems.map((i) => `${i.trimName}: ${i.missingSteps.join(',')}`).join('\n');
      uni.showModal({ title: '物料未齐套', content: notReady, showCancel: false });
    }
    await loadOrderDetail();
  } catch (err: any) {
    uni.showToast({ title: '检查失败', icon: 'none' });
  }
}

/** 跳转物料管理页 */
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

/* 管理操作区 */
.summary-actions { display: flex; gap: 16rpx; margin-top: 20rpx; flex-wrap: wrap; border-top: 1rpx solid #f0f0f0; padding-top: 20rpx; }
.action-btn { padding: 10rpx 24rpx; border-radius: 10rpx; font-size: 26rpx; background: #E6F1FB; color: #185FA5; }
.action-danger { background: #FCEBEB; color: #A32D2D; }

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

/* 面料信息 */
.fabric-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.fabric-item:last-child { border-bottom: none; }

/* 颜色尺码矩阵 — 横向滚动 */
.matrix-wrapper { border: 1rpx solid #e0e0e0; border-radius: 8rpx; overflow: hidden; }
.matrix-scroll { width: 100%; white-space: nowrap; }
.matrix-table { display: inline-block; min-width: 100%; }
.matrix-row { display: flex; border-bottom: 1rpx solid #f0f0f0; }
.matrix-row:last-child { border-bottom: none; }
.matrix-cell {
  flex-shrink: 0;
  text-align: center;
  padding: 16rpx 8rpx;
  font-size: 24rpx;
  border-right: 1rpx solid #f0f0f0;
  min-height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.matrix-cell:last-child { border-right: none; }
.matrix-header { background: #F1EFE8; }
.matrix-color-header { font-weight: 600; color: #5F5E5A; width: 140rpx; min-width: 140rpx; }
.matrix-size-header { font-weight: 600; color: #5F5E5A; width: 100rpx; min-width: 100rpx; }
.matrix-qty-cell { color: #333333; width: 100rpx; min-width: 100rpx; }
.matrix-total-header { font-weight: 600; color: #5F5E5A; background: #E1F5EE; width: 110rpx; min-width: 110rpx; }
.matrix-color-cell { font-weight: 500; color: #2C2C2A; width: 140rpx; min-width: 140rpx; }
.matrix-total-cell { background: #E1F5EE; font-weight: 600; color: #0F6E56; width: 110rpx; min-width: 110rpx; }
.matrix-footer { background: #F1EFE8; }
.matrix-footer .matrix-cell { font-weight: 600; }
.matrix-size-total { color: #5F5E5A; width: 100rpx; min-width: 100rpx; }
.matrix-grand-total { background: #E1F5EE; font-weight: 700; color: #0F6E56; font-size: 28rpx; width: 110rpx; min-width: 110rpx; }

/* 物料 */
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
.dates-row { display: flex; gap: 20rpx; margin-top: 8rpx; }
.date-text { font-size: 22rpx; color: #888780; }
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

/* 可见性设置成员多选 */
.member-check-row { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 4rpx; border-bottom: 1rpx solid #f5f5f5; }
.member-check-name { font-size: 26rpx; color: #2C2C2A; }
.member-check-box { width: 36rpx; height: 36rpx; border: 2rpx solid #C0C0C0; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: #fff; }
.member-check-box.checked { background: #185FA5; border-color: #185FA5; }
.hint-text { font-size: 24rpx; color: #888780; padding: 16rpx 4rpx; line-height: 1.6; }

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
.modal-title { font-size: 30rpx; font-weight: 600; color: #2C2C2A; }
.modal-close { font-size: 32rpx; color: #B4B2A9; }
.modal-body { flex: 1; padding: 24rpx; max-height: 60vh; }
.modal-footer { display: flex; gap: 20rpx; padding: 20rpx 24rpx; border-top: 1rpx solid #f0f0f0; }

/* 表单 */
.form-item { margin-bottom: 20rpx; }
.form-label { display: block; font-size: 26rpx; color: #5F5E5A; margin-bottom: 8rpx; }
.form-label.required::after { content: ' *'; color: #A32D2D; }
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
.btn-cancel { flex: 1; height: 80rpx; line-height: 80rpx; background: #F1EFE8; color: #5F5E5A; border-radius: 12rpx; font-size: 28rpx; border: none; }
.btn-submit { flex: 1; height: 80rpx; line-height: 80rpx; background: #185FA5; color: #fff; border-radius: 12rpx; font-size: 28rpx; border: none; }

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
