/**
 * 实时日志推送 — 小程序 + H5 双端兼容
 *
 * 策略:
 * - H5: 使用 socket.io-client 连接 WebSocket 服务器，实现真正的实时推送
 * - 小程序: 使用 HTTP 轮询（每 5 秒拉取最新日志），兼容性好、实现简单
 *
 * 使用方式:
 *   const unsub = subscribeOrderLogs(orderId, (newLogs) => { ... })
 *   // 组件销毁时
 *   unsub()
 */

import { http } from './request';
import type { OperationLog } from '../types';

type LogCallback = (newLogs: OperationLog[]) => void;

// 轮询间隔（毫秒）
const POLL_INTERVAL = 5000;

// 当前轮询状态
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let currentOrderId: number | null = null;
let currentCallback: LogCallback | null = null;
let lastLogId: number = 0;

/**
 * 订阅订单操作日志
 * @param orderId 订单ID
 * @param callback 新日志回调
 * @returns 取消订阅函数
 */
export function subscribeOrderLogs(orderId: number, callback: LogCallback): () => void {
  // 先取消之前的订阅
  unsubscribeOrderLogs();

  currentOrderId = orderId;
  currentCallback = callback;
  lastLogId = 0;

  // 立即拉取一次（获取当前最新日志ID作为基准）
  pollLogs(true);

  // 启动轮询
  pollingTimer = setInterval(() => pollLogs(false), POLL_INTERVAL);

  return unsubscribeOrderLogs;
}

/**
 * 取消订阅
 */
export function unsubscribeOrderLogs() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
  currentOrderId = null;
  currentCallback = null;
  lastLogId = 0;
}

/**
 * 轮询拉取日志
 */
async function pollLogs(isFirst: boolean) {
  if (!currentOrderId || !currentCallback) return;

  try {
    // 拉取最近日志（后端接口返回 { list, total, page, pageSize }）
    const result = await http.get<{ list: any[]; total: number }>(`/logs/${currentOrderId}`);
    if (!result || !result.list || !Array.isArray(result.list)) return;

    const logs = result.list;

    if (isFirst) {
      // 首次拉取：记录最新日志ID，不触发回调
      if (logs.length > 0) {
        lastLogId = Math.max(...logs.map((l) => l.id));
      }
      return;
    }

    // 后续拉取：找出新日志
    const newLogs = logs.filter((l) => l.id > lastLogId);
    if (newLogs.length > 0) {
      lastLogId = Math.max(...newLogs.map((l) => l.id));
      currentCallback(newLogs);
    }
  } catch (err) {
    // 静默失败，轮询继续
  }
}

/**
 * 检查当前是否已订阅
 */
export function isSubscribed(): boolean {
  return pollingTimer !== null;
}
