/**
 * 订单相关 API
 */

import { http } from '../utils/request';
import type { OrderListItem, OrderDetail, ColorSizeItem } from '../types';

export interface OrderListResult {
  list: OrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOrderPayload {
  orderNo: string;
  customerName: string;
  styleNo: string;
  styleName?: string;
  season?: string;
  category?: string;
  garmentImageUrl?: string;
  deliveryDate: string;
  factoryName?: string;
  coordinatorName?: string;
  merchandiserName?: string;
  colorSizes: ColorSizeItem[];
  remark?: string;
}

/** 获取订单列表 */
export function getOrders(params?: { page?: number; limit?: number; status?: string }) {
  // 过滤掉 undefined/null 值，避免小程序请求序列化问题
  const cleanParams: Record<string, any> = {};
  if (params) {
    Object.keys(params).forEach(key => {
      const val = (params as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });
  }
  return http.get<OrderListResult>('/orders', { data: cleanParams });
}

/** 获取订单详情 */
export function getOrderDetail(id: number) {
  return http.get<OrderDetail>(`/orders/${id}`);
}

/** 创建订单 */
export function createOrder(data: CreateOrderPayload) {
  return http.post<{ id: number; orderNo: string }>('/orders', data, { showLoading: true, loadingText: '创建中...' });
}

/** 编辑订单（基础信息+重新分配理单/跟单+颜色尺码） */
export function updateOrder(id: number, data: Partial<CreateOrderPayload>) {
  return http.patch<{ updated: boolean; changes: string[] }>(`/orders/${id}`, data, { showLoading: true, loadingText: '保存中...' });
}

/** 删除订单（仅管理员） */
export function deleteOrder(id: number) {
  return http.delete<{ deleted: boolean }>(`/orders/${id}`);
}

/** 设置订单可见性（仅管理员） */
export function updateOrderVisibility(id: number, data: { visibility?: 'restricted' | 'company'; visibleUserIds?: number[] }) {
  return http.patch<{ updated: boolean; changes: string[] }>(`/orders/${id}/visibility`, data);
}

/** 新增面料记录 */
export function addFabric(orderId: number, data: {
  fabricName: string;
  color?: string;
  totalDemand?: number;
  supplierName?: string;
  orderDate?: string;
  plannedDate?: string;
  specification?: string;
  usagePerPiece?: number;
  notes?: string;
}) {
  return http.post<{ id: number; fabricName: string }>(`/orders/${orderId}/fabrics`, data, { showLoading: true, loadingText: '保存中...' });
}

/** 编辑面料记录 */
export function updateFabric(orderId: number, fabricId: number, data: Partial<{
  fabricName: string;
  color: string;
  totalDemand: number;
  supplierName: string;
  orderDate: string;
  plannedDate: string;
  specification: string;
  usagePerPiece: number;
  notes: string;
}>) {
  return http.patch<{ updated: boolean; changes: string[] }>(`/orders/${orderId}/fabrics/${fabricId}`, data, { showLoading: true, loadingText: '保存中...' });
}

/** 更新订单状态 */
export function updateOrderStatus(id: number, orderStatus: string) {
  return http.patch<{ id: number; orderStatus: string }>(`/orders/${id}/status`, { orderStatus });
}

/** 更新 T&A 阶段状态 */
export function updateTaStage(orderId: number, stageCode: string, data: {
  status: string;
  plannedDate?: string;
  actualDate?: string;
  completionPct?: number;
  remark?: string;
}) {
  return http.patch<{ id: number; stageCode: string; status: string }>(
    `/orders/${orderId}/ta-stages/${stageCode}`,
    data,
  );
}

/** 一键查看辅料齐套状态 */
export function checkTrimsReady(orderId: number) {
  return http.get<{
    allReady: boolean;
    readyCount: number;
    totalCount: number;
    notReadyItems: { id: number; trimName: string; missingSteps: string[] }[];
  }>(`/trims/check/${orderId}`);
}

/** 获取订单下拉选项（客户、工厂、理单、跟单） */
export function getOrderOptions() {
  return http.get<{
    customers: { id: number; code: string; name: string }[];
    factories: { id: number; code: string; name: string; type: string }[];
    coordinators: { id: number; name: string }[];
    merchandisers: { id: number; name: string }[];
  }>('/orders/options');
}
