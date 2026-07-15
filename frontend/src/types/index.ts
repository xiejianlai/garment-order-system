/**
 * 类型定义 — 前后端共享
 */

export type UserRole = 'admin' | 'merchandiser' | 'factory' | 'customer';

export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: UserRole;
  avatarUrl?: string;
  factoryId: number | null;
  customerId: number | null;
  phone?: string;
  email?: string;
  factory?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
}

export type OrderStatus =
  | 'draft' | 'confirmed' | 'in_progress' | 'shipped' | 'completed' | 'cancelled';

export interface OrderListItem {
  id: number;
  orderNo: string;
  customerId: number;
  styleNo: string;
  styleName?: string;
  season?: string;
  category?: string;
  garmentImageUrl?: string;
  totalQty: number;
  deliveryDate: string;
  assignedFactoryId: number | null;
  merchandiserId: number | null;
  orderStatus: OrderStatus;
  customer?: { id: number; customerName: string };
  assignedFactory?: { id: number; factoryName: string };
  _count?: { trims: number; taStages: number };
}

export interface ColorSizeItem {
  id: number;
  orderId: number;
  color: string;
  colorCode?: string;
  size: string;
  sizeGroup?: string;
  quantity: number;
}

export interface OrderTrim {
  id: number;
  orderId: number;
  trimName: string;
  trimCategory: string;
  specification?: string;
  usagePerPiece: number;
  unit: string;
  totalDemand: number;
  supplierId: number | null;
  samplingStatus: string;
  samplingSentDate?: string;
  samplingApprovedDate?: string;
  samplingRemark?: string;
  bulkPoNo?: string;
  bulkPoStatus: string;
  bulkPoDate?: string;
  bulkEtd?: string;
  bulkEta?: string;
  receivedQty?: number;
  qtyCheckStatus: string;
  inspectionResult: string;
  inspectionNote?: string;
  isReady: number;
  readyDate?: string;
  supplier?: { id: number; factoryName: string };
}

export interface OrderTaStage {
  id: number;
  orderId: number;
  stageCategory: 'sampling' | 'production' | 'inspection' | 'shipping';
  stageCode: string;
  stageName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  plannedDate?: string;
  actualDate?: string;
  completionPct: number;
  remark?: string;
  sortOrder: number;
}

export interface OperationLog {
  id: number;
  orderId: number;
  userId: number;
  userName: string;
  userRole: string;
  module: string;
  action: string;
  targetId?: number;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeSummary?: string;
  createdAt: string;
}

export interface OrderDetail extends OrderListItem {
  remark?: string;
  createdBy: number;
  colorSizes: ColorSizeItem[];
  trims: OrderTrim[];
  taStages: OrderTaStage[];
  logs: OperationLog[];
  files: any[];
  trimsSummary: { ready: number; total: number; allReady: boolean };
  taSummary: { completed: number; total: number; delayed: number };
}

/** T&A 阶段中文映射 */
export const TA_CATEGORY_LABELS: Record<string, string> = {
  sampling: '打样阶段',
  production: '大货生产',
  inspection: '验货阶段',
  shipping: '出货阶段',
};

/** 状态中文映射 */
export const STATUS_LABELS: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '延误',
};

/** 状态颜色映射 */
export const STATUS_COLORS: Record<string, string> = {
  not_started: 'tag-gray',
  in_progress: 'tag-blue',
  completed: 'tag-green',
  delayed: 'tag-red',
};

/** 订单状态中文映射 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  in_progress: '生产中',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

/** 辅料打样状态映射 */
export const TRIM_SAMPLING_LABELS: Record<string, string> = {
  pending: '待处理',
  in_sampling: '打样中',
  sent_for_approval: '寄客批',
  approved: '已确认',
  rejected: '已拒绝',
};

/** 辅料大货状态映射 */
export const TRIM_BULK_LABELS: Record<string, string> = {
  not_ordered: '未下单',
  ordered: '已下单',
  producing: '生产中',
  shipped: '已发货',
  received: '已到厂',
};

/** 角色中文映射 */
export const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  merchandiser: '跟单员',
  factory: '工厂',
  customer: '客户',
};
