/**
 * 订单相关 API
 */

import { http } from '../utils/request';
import type { OrderListItem, OrderDetail, ColorSizeItem } from '../types';

export interface OrderListResult {
  list: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
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
export function getOrders(params?: { page?: number; pageSize?: number; status?: string }) {
  return http.get<OrderListResult>('/orders', { data: params });
}

/** 获取订单详情 */
export function getOrderDetail(id: number) {
  return http.get<OrderDetail>(`/orders/${id}`);
}

/** 创建订单 */
export function createOrder(data: CreateOrderPayload) {
  return http.post<{ id: number; orderNo: string }>('/orders', data, { showLoading: true, loadingText: '创建中...' });
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
