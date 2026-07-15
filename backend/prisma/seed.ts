import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  // 清理旧数据（按依赖顺序删除）
  console.log('清理旧数据...');
  await prisma.operationLog.deleteMany();
  await prisma.orderFile.deleteMany();
  await prisma.orderTaStage.deleteMany();
  await prisma.orderTrim.deleteMany();
  await prisma.orderFabric.deleteMany();
  await prisma.orderColorSize.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.factory.deleteMany();
  await prisma.sysUser.deleteMany();
  await prisma.company.deleteMany();
  console.log('旧数据已清理');

  const passwordHash = await bcrypt.hash('123456', 10);
  const avatarColors = ['#1677ff', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#08979c', '#389e0d', '#5cdbd3', '#b7eb8f'];

  // 1. 创建演示公司
  const company = await prisma.company.create({
    data: {
      code: 'DEMO01',
      name: '演示贸易公司',
    },
  });
  console.log(`公司创建: ${company.code} - ${company.name}`);

  // 2. 创建团队成员
  const admin = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'admin', passwordHash, realName: '系统管理员', role: 'admin', phone: '13800000001', avatarColor: avatarColors[0], lastLoginAt: new Date('2026-07-12T20:30:00') },
  });
  const coordinator1 = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'liwen', passwordHash, realName: '李理单', role: 'coordinator', phone: '13800000002', avatarColor: avatarColors[1], lastLoginAt: new Date('2026-07-12T18:15:00') },
  });
  const coordinator2 = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'wangli', passwordHash, realName: '王理单', role: 'coordinator', phone: '13800000005', avatarColor: avatarColors[6], lastLoginAt: new Date('2026-07-11T16:20:00') },
  });
  const coordinator3 = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'chenli', passwordHash, realName: '陈理单', role: 'coordinator', phone: '13800000006', avatarColor: avatarColors[8], lastLoginAt: new Date('2026-07-10T10:00:00') },
  });
  const merch1 = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'zhanggen', passwordHash, realName: '张跟单', role: 'merchandiser', phone: '13800000003', avatarColor: avatarColors[2], lastLoginAt: new Date('2026-07-11T09:30:00') },
  });
  const merch2 = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'liugen', passwordHash, realName: '刘跟单', role: 'merchandiser', phone: '13800000007', avatarColor: avatarColors[7], lastLoginAt: new Date('2026-07-12T08:45:00') },
  });
  const merch3 = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'zhaogen', passwordHash, realName: '赵跟单', role: 'merchandiser', phone: '13800000008', avatarColor: avatarColors[9], lastLoginAt: new Date('2026-07-09T14:30:00') },
  });

  // 3. 创建客户
  const customer1 = await prisma.customer.create({
    data: { companyId: company.id, customerCode: 'CUST-001', customerName: 'Global Fashion Ltd.', contactPerson: 'John Smith', phone: '+1-555-0100', email: 'john@globalfashion.com', country: 'USA' },
  });
  const customer2 = await prisma.customer.create({
    data: { companyId: company.id, customerCode: 'CUST-002', customerName: 'Mango Retail Group', contactPerson: 'Maria Lopez', phone: '+34-555-0200', country: 'Spain' },
  });

  // 创建客户用户
  const customerUser = await prisma.sysUser.create({
    data: { companyId: company.id, username: 'john', passwordHash, realName: 'John Smith', role: 'customer', phone: '13800000004', avatarColor: avatarColors[3], customerId: customer1.id, lastLoginAt: new Date('2026-07-10T14:00:00') },
  });

  // 4. 创建工厂和供应商
  const factory1 = await prisma.factory.create({
    data: { companyId: company.id, factoryCode: 'FAC-001', factoryName: '广州华盛服装制造有限公司', factoryType: 'factory', contactPerson: '陈厂长', phone: '13800138001', capability: '针织T恤、卫衣、运动服' },
  });
  const factory2 = await prisma.factory.create({
    data: { companyId: company.id, factoryCode: 'FAC-002', factoryName: '东莞利丰针织厂', factoryType: 'factory', contactPerson: '刘厂长', phone: '13800138002', capability: '卫衣、裤装、夹克' },
  });
  const supplier1 = await prisma.factory.create({
    data: { companyId: company.id, factoryCode: 'SUP-001', factoryName: '义乌辅料批发中心', factoryType: 'supplier', contactPerson: '王经理', phone: '13800138003', capability: '主唛、洗水唛、吊牌、拉链、纽扣' },
  });

  // 5. 创建订单1: 纯棉圆领T恤 — 李理单 + 张跟单
  const order1 = await prisma.order.create({
    data: {
      companyId: company.id,
      orderNo: 'PO-2026-0001',
      customerId: customer1.id,
      customerName: customer1.customerName,
      styleNo: 'TS-001',
      styleName: '纯棉圆领T恤',
      season: '2026SS',
      category: 'T恤',
      totalQty: 1000,
      deliveryDate: new Date('2026-09-30'),
      factoryId: factory1.id,
      factoryName: factory1.factoryName,
      coordinatorId: coordinator1.id,
      coordinatorName: coordinator1.realName,
      merchandiserId: merch1.id,
      merchandiserName: merch1.realName,
      orderStatus: 'in_progress',
      createdBy: admin.id,
    },
  });

  await prisma.orderColorSize.createMany({
    data: [
      { orderId: order1.id, color: '黑色', colorCode: 'BLK', size: 'S', quantity: 100, rowColor: '#45AAF2', sortOrder: 0 },
      { orderId: order1.id, color: '黑色', colorCode: 'BLK', size: 'M', quantity: 150, rowColor: '#45AAF2', sortOrder: 1 },
      { orderId: order1.id, color: '黑色', colorCode: 'BLK', size: 'L', quantity: 150, rowColor: '#45AAF2', sortOrder: 2 },
      { orderId: order1.id, color: '黑色', colorCode: 'BLK', size: 'XL', quantity: 100, rowColor: '#45AAF2', sortOrder: 3 },
      { orderId: order1.id, color: '白色', colorCode: 'WHT', size: 'S', quantity: 100, rowColor: '#FF9F43', sortOrder: 4 },
      { orderId: order1.id, color: '白色', colorCode: 'WHT', size: 'M', quantity: 150, rowColor: '#FF9F43', sortOrder: 5 },
      { orderId: order1.id, color: '白色', colorCode: 'WHT', size: 'L', quantity: 150, rowColor: '#FF9F43', sortOrder: 6 },
      { orderId: order1.id, color: '白色', colorCode: 'WHT', size: 'XL', quantity: 100, rowColor: '#FF9F43', sortOrder: 7 },
    ],
  });

  // 面料
  await prisma.orderFabric.createMany({
    data: [
      { orderId: order1.id, fabricName: '全棉汗布', color: '黑色/白色', specification: '180gsm 58/60"', usagePerPiece: 0.22, totalDemand: 220, supplierId: supplier1.id, supplierName: supplier1.factoryName, status: 'received', qtyCheckStatus: 'verified', plannedDate: new Date('2026-07-20'), actualDate: new Date('2026-07-18'), notes: '品质OK', createdBy: admin.id },
      { orderId: order1.id, fabricName: '罗纹口', color: '黑色/白色', specification: '1x1棉氨纶', usagePerPiece: 0.02, totalDemand: 20, supplierId: supplier1.id, supplierName: supplier1.factoryName, status: 'received', qtyCheckStatus: 'verified', plannedDate: new Date('2026-07-20'), actualDate: new Date('2026-07-18'), createdBy: admin.id },
    ],
  });

  // 辅料
  await prisma.orderTrim.createMany({
    data: [
      { orderId: order1.id, trimName: '主唛', trimCategory: 'label', color: '黑色/白色', specification: '织标 2x4cm', usagePerPiece: 1, totalDemand: 1000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'approved', bulkPoStatus: 'received', qtyCheckStatus: 'sufficient', inspectionResult: 'pass', isReady: 1, createdBy: admin.id },
      { orderId: order1.id, trimName: '洗水唛', trimCategory: 'care_label', color: '黑色/白色', specification: '丝印 3x5cm', usagePerPiece: 1, totalDemand: 1000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'approved', bulkPoStatus: 'received', qtyCheckStatus: 'sufficient', inspectionResult: 'pass', isReady: 1, createdBy: admin.id },
      { orderId: order1.id, trimName: '吊牌', trimCategory: 'hangtag', color: '通用', specification: '300g铜版纸', usagePerPiece: 1, totalDemand: 1000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'approved', bulkPoStatus: 'ordered', qtyCheckStatus: 'pending', inspectionResult: 'pending', isReady: 0, createdBy: admin.id },
      { orderId: order1.id, trimName: '主拉链', trimCategory: 'zipper', color: '黑色', specification: 'YKK 5#尼龙', usagePerPiece: 1, totalDemand: 1000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'sent_for_approval', bulkPoStatus: 'not_ordered', qtyCheckStatus: 'pending', inspectionResult: 'pending', isReady: 0, createdBy: admin.id },
      { orderId: order1.id, trimName: '纽扣', trimCategory: 'button', color: '黑色', specification: '树脂 18mm', usagePerPiece: 3, totalDemand: 3000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'approved', bulkPoStatus: 'producing', qtyCheckStatus: 'pending', inspectionResult: 'pending', isReady: 0, createdBy: admin.id },
      { orderId: order1.id, trimName: '包装袋', trimCategory: 'other', color: '透明', specification: 'PE 25x35cm', usagePerPiece: 1, totalDemand: 1000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'approved', bulkPoStatus: 'received', qtyCheckStatus: 'sufficient', inspectionResult: 'pass', isReady: 1, createdBy: admin.id },
    ],
  });

  // T&A 13阶段
  const taStages1 = [
    { stageCategory: 'sampling', stageCode: 'proto', stageName: '初样 (Proto)', status: 'completed', plannedDate: new Date('2026-07-01'), actualDate: new Date('2026-06-28'), completionPct: 100, sortOrder: 1 },
    { stageCategory: 'sampling', stageCode: 'pps', stageName: '产前样 (PPS)', status: 'completed', plannedDate: new Date('2026-07-15'), actualDate: new Date('2026-07-14'), completionPct: 100, sortOrder: 2 },
    { stageCategory: 'sampling', stageCode: 'confirmed', stageName: '确认样', status: 'completed', plannedDate: new Date('2026-07-25'), actualDate: new Date('2026-07-24'), completionPct: 100, sortOrder: 3 },
    { stageCategory: 'production', stageCode: 'cutting', stageName: '裁剪 (Cutting)', status: 'completed', plannedDate: new Date('2026-08-01'), actualDate: new Date('2026-07-30'), startDate: new Date('2026-07-28'), completionPct: 100, sortOrder: 4 },
    { stageCategory: 'production', stageCode: 'sewing', stageName: '车缝 (Sewing)', status: 'in_progress', plannedDate: new Date('2026-08-15'), startDate: new Date('2026-08-01'), completionPct: 60, sortOrder: 5 },
    { stageCategory: 'production', stageCode: 'packing', stageName: '后整包装 (Packing)', status: 'not_started', plannedDate: new Date('2026-09-01'), sortOrder: 6 },
    { stageCategory: 'inspection', stageCode: 'dupro', stageName: '中期检验 (Dupro)', status: 'not_started', plannedDate: new Date('2026-08-20'), sortOrder: 7 },
    { stageCategory: 'inspection', stageCode: 'fri', stageName: '尾期检验 (FRI)', status: 'not_started', plannedDate: new Date('2026-09-10'), sortOrder: 8 },
    { stageCategory: 'inspection', stageCode: 'report', stageName: '验货报告', status: 'not_started', plannedDate: new Date('2026-09-12'), sortOrder: 9 },
    { stageCategory: 'shipping', stageCode: 'booking', stageName: '订舱', status: 'not_started', plannedDate: new Date('2026-09-15'), sortOrder: 10 },
    { stageCategory: 'shipping', stageCode: 'loading', stageName: '装柜', status: 'not_started', plannedDate: new Date('2026-09-20'), sortOrder: 11 },
    { stageCategory: 'shipping', stageCode: 'etd', stageName: '离港 (ETD)', status: 'not_started', plannedDate: new Date('2026-09-22'), sortOrder: 12 },
    { stageCategory: 'shipping', stageCode: 'eta', stageName: '到港 (ETA)', status: 'not_started', plannedDate: new Date('2026-10-10'), sortOrder: 13 },
  ];
  await prisma.orderTaStage.createMany({
    data: taStages1.map(s => ({ orderId: order1.id, ...s })),
  });

  // 6. 创建订单2: 连帽卫衣 — 王理单 + 刘跟单
  const order2 = await prisma.order.create({
    data: {
      companyId: company.id,
      orderNo: 'PO-2026-0002',
      customerId: customer2.id,
      customerName: customer2.customerName,
      styleNo: 'HD-002',
      styleName: '连帽卫衣',
      season: '2026AW',
      category: '卫衣',
      totalQty: 2500,
      deliveryDate: new Date('2026-10-31'),
      factoryId: factory2.id,
      factoryName: factory2.factoryName,
      coordinatorId: coordinator2.id,
      coordinatorName: coordinator2.realName,
      merchandiserId: merch2.id,
      merchandiserName: merch2.realName,
      orderStatus: 'confirmed',
      createdBy: admin.id,
    },
  });

  await prisma.orderColorSize.createMany({
    data: [
      { orderId: order2.id, color: '深灰', colorCode: 'GRY', size: 'S', quantity: 200, rowColor: '#26DE81', sortOrder: 0 },
      { orderId: order2.id, color: '深灰', colorCode: 'GRY', size: 'M', quantity: 300, rowColor: '#26DE81', sortOrder: 1 },
      { orderId: order2.id, color: '深灰', colorCode: 'GRY', size: 'L', quantity: 300, rowColor: '#26DE81', sortOrder: 2 },
      { orderId: order2.id, color: '深灰', colorCode: 'GRY', size: 'XL', quantity: 200, rowColor: '#26DE81', sortOrder: 3 },
      { orderId: order2.id, color: '深灰', colorCode: 'GRY', size: 'XXL', quantity: 100, rowColor: '#26DE81', sortOrder: 4 },
      { orderId: order2.id, color: '藏青', colorCode: 'NVY', size: 'S', quantity: 200, rowColor: '#FECA57', sortOrder: 5 },
      { orderId: order2.id, color: '藏青', colorCode: 'NVY', size: 'M', quantity: 300, rowColor: '#FECA57', sortOrder: 6 },
      { orderId: order2.id, color: '藏青', colorCode: 'NVY', size: 'L', quantity: 300, rowColor: '#FECA57', sortOrder: 7 },
      { orderId: order2.id, color: '藏青', colorCode: 'NVY', size: 'XL', quantity: 200, rowColor: '#FECA57', sortOrder: 8 },
      { orderId: order2.id, color: '藏青', colorCode: 'NVY', size: 'XXL', quantity: 100, rowColor: '#FECA57', sortOrder: 9 },
      { orderId: order2.id, color: '酒红', colorCode: 'RED', size: 'S', quantity: 100, rowColor: '#FF6B6B', sortOrder: 10 },
      { orderId: order2.id, color: '酒红', colorCode: 'RED', size: 'M', quantity: 150, rowColor: '#FF6B6B', sortOrder: 11 },
      { orderId: order2.id, color: '酒红', colorCode: 'RED', size: 'L', quantity: 150, rowColor: '#FF6B6B', sortOrder: 12 },
      { orderId: order2.id, color: '酒红', colorCode: 'RED', size: 'XL', quantity: 100, rowColor: '#FF6B6B', sortOrder: 13 },
      { orderId: order2.id, color: '酒红', colorCode: 'RED', size: 'XXL', quantity: 50, rowColor: '#FF6B6B', sortOrder: 14 },
    ],
  });

  // 订单2的辅料
  await prisma.orderTrim.createMany({
    data: [
      { orderId: order2.id, trimName: '主唛', trimCategory: 'label', color: '深灰/藏青/酒红', specification: '织标 2x5cm', usagePerPiece: 1, totalDemand: 2500, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'in_sampling', bulkPoStatus: 'not_ordered', createdBy: admin.id },
      { orderId: order2.id, trimName: '抽绳', trimCategory: 'other', color: '深灰/藏青', specification: '棉绳 120cm', usagePerPiece: 2, totalDemand: 5000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'pending', bulkPoStatus: 'not_ordered', createdBy: admin.id },
      { orderId: order2.id, trimName: '金属气眼', trimCategory: 'other', color: '古铜', specification: '铜色 8mm', usagePerPiece: 4, totalDemand: 10000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'sent_for_approval', bulkPoStatus: 'not_ordered', createdBy: admin.id },
    ],
  });

  // 订单2 T&A
  const taStages2 = [
    { stageCategory: 'sampling', stageCode: 'proto', stageName: '初样 (Proto)', status: 'completed', plannedDate: new Date('2026-08-01'), actualDate: new Date('2026-07-28'), completionPct: 100, sortOrder: 1 },
    { stageCategory: 'sampling', stageCode: 'pps', stageName: '产前样 (PPS)', status: 'in_progress', plannedDate: new Date('2026-08-15'), startDate: new Date('2026-08-10'), completionPct: 80, sortOrder: 2 },
    { stageCategory: 'sampling', stageCode: 'confirmed', stageName: '确认样', status: 'not_started', sortOrder: 3 },
    { stageCategory: 'production', stageCode: 'cutting', stageName: '裁剪 (Cutting)', status: 'not_started', sortOrder: 4 },
    { stageCategory: 'production', stageCode: 'sewing', stageName: '车缝 (Sewing)', status: 'not_started', sortOrder: 5 },
    { stageCategory: 'production', stageCode: 'packing', stageName: '后整包装 (Packing)', status: 'not_started', sortOrder: 6 },
    { stageCategory: 'inspection', stageCode: 'dupro', stageName: '中期检验 (Dupro)', status: 'not_started', sortOrder: 7 },
    { stageCategory: 'inspection', stageCode: 'fri', stageName: '尾期检验 (FRI)', status: 'not_started', sortOrder: 8 },
    { stageCategory: 'inspection', stageCode: 'report', stageName: '验货报告', status: 'not_started', sortOrder: 9 },
    { stageCategory: 'shipping', stageCode: 'booking', stageName: '订舱', status: 'not_started', sortOrder: 10 },
    { stageCategory: 'shipping', stageCode: 'loading', stageName: '装柜', status: 'not_started', sortOrder: 11 },
    { stageCategory: 'shipping', stageCode: 'etd', stageName: '离港 (ETD)', status: 'not_started', sortOrder: 12 },
    { stageCategory: 'shipping', stageCode: 'eta', stageName: '到港 (ETA)', status: 'not_started', sortOrder: 13 },
  ];
  await prisma.orderTaStage.createMany({ data: taStages2.map(s => ({ orderId: order2.id, ...s })) });

  // 7. 创建订单3: 工装长裤 — 陈理单 + 赵跟单
  const order3 = await prisma.order.create({
    data: {
      companyId: company.id,
      orderNo: 'PO-2026-0003',
      customerId: customer1.id,
      customerName: customer1.customerName,
      styleNo: 'PT-003',
      styleName: '工装长裤',
      season: '2026AW',
      category: '裤装',
      totalQty: 800,
      deliveryDate: new Date('2026-11-15'),
      factoryId: factory1.id,
      factoryName: factory1.factoryName,
      coordinatorId: coordinator3.id,
      coordinatorName: coordinator3.realName,
      merchandiserId: merch3.id,
      merchandiserName: merch3.realName,
      orderStatus: 'draft',
      createdBy: admin.id,
    },
  });

  await prisma.orderColorSize.createMany({
    data: [
      { orderId: order3.id, color: '卡其', colorCode: 'KHK', size: 'S', quantity: 80, sortOrder: 0 },
      { orderId: order3.id, color: '卡其', colorCode: 'KHK', size: 'M', quantity: 120, sortOrder: 1 },
      { orderId: order3.id, color: '卡其', colorCode: 'KHK', size: 'L', quantity: 120, sortOrder: 2 },
      { orderId: order3.id, color: '卡其', colorCode: 'KHK', size: 'XL', quantity: 80, sortOrder: 3 },
    ],
  });

  // 订单3 T&A（全部未开始）
  await prisma.orderTaStage.createMany({
    data: TA_STAGE_TEMPLATES().map(s => ({ orderId: order3.id, ...s })),
  });

  // 8. 创建订单4: 牛仔夹克 — 李理单 + 张跟单
  const order4 = await prisma.order.create({
    data: {
      companyId: company.id,
      orderNo: 'PO-2026-0004',
      customerId: customer2.id,
      customerName: customer2.customerName,
      styleNo: 'JK-004',
      styleName: '牛仔夹克',
      season: '2026AW',
      category: '外套',
      totalQty: 1200,
      deliveryDate: new Date('2026-11-30'),
      factoryId: factory2.id,
      factoryName: factory2.factoryName,
      coordinatorId: coordinator1.id,
      coordinatorName: coordinator1.realName,
      merchandiserId: merch1.id,
      merchandiserName: merch1.realName,
      orderStatus: 'confirmed',
      createdBy: admin.id,
    },
  });

  await prisma.orderColorSize.createMany({
    data: [
      { orderId: order4.id, color: '深蓝', colorCode: 'NAV', size: 'S', quantity: 150, rowColor: '#4FC3F7', sortOrder: 0 },
      { orderId: order4.id, color: '深蓝', colorCode: 'NAV', size: 'M', quantity: 250, rowColor: '#4FC3F7', sortOrder: 1 },
      { orderId: order4.id, color: '深蓝', colorCode: 'NAV', size: 'L', quantity: 300, rowColor: '#4FC3F7', sortOrder: 2 },
      { orderId: order4.id, color: '深蓝', colorCode: 'NAV', size: 'XL', quantity: 250, rowColor: '#4FC3F7', sortOrder: 3 },
      { orderId: order4.id, color: '深蓝', colorCode: 'NAV', size: 'XXL', quantity: 250, rowColor: '#4FC3F7', sortOrder: 4 },
    ],
  });

  // 订单4辅料
  await prisma.orderTrim.createMany({
    data: [
      { orderId: order4.id, trimName: '纽扣', trimCategory: 'button', color: '银色', specification: '金属 15mm', usagePerPiece: 5, totalDemand: 6000, supplierId: supplier1.id, supplierName: supplier1.factoryName, samplingStatus: 'approved', bulkPoStatus: 'ordered', createdBy: admin.id },
    ],
  });

  // 订单4 T&A
  const taStages4 = [
    { stageCategory: 'sampling', stageCode: 'proto', stageName: '初样 (Proto)', status: 'completed', plannedDate: new Date('2026-08-10'), actualDate: new Date('2026-08-08'), completionPct: 100, sortOrder: 1 },
    { stageCategory: 'sampling', stageCode: 'pps', stageName: '产前样 (PPS)', status: 'in_progress', plannedDate: new Date('2026-08-25'), startDate: new Date('2026-08-15'), completionPct: 60, sortOrder: 2 },
    { stageCategory: 'sampling', stageCode: 'confirmed', stageName: '确认样', status: 'not_started', sortOrder: 3 },
    { stageCategory: 'production', stageCode: 'cutting', stageName: '裁剪 (Cutting)', status: 'not_started', sortOrder: 4 },
    { stageCategory: 'production', stageCode: 'sewing', stageName: '车缝 (Sewing)', status: 'not_started', sortOrder: 5 },
    { stageCategory: 'production', stageCode: 'packing', stageName: '后整包装 (Packing)', status: 'not_started', sortOrder: 6 },
    { stageCategory: 'inspection', stageCode: 'dupro', stageName: '中期检验 (Dupro)', status: 'not_started', sortOrder: 7 },
    { stageCategory: 'inspection', stageCode: 'fri', stageName: '尾期检验 (FRI)', status: 'not_started', sortOrder: 8 },
    { stageCategory: 'inspection', stageCode: 'report', stageName: '验货报告', status: 'not_started', sortOrder: 9 },
    { stageCategory: 'shipping', stageCode: 'booking', stageName: '订舱', status: 'not_started', sortOrder: 10 },
    { stageCategory: 'shipping', stageCode: 'loading', stageName: '装柜', status: 'not_started', sortOrder: 11 },
    { stageCategory: 'shipping', stageCode: 'etd', stageName: '离港 (ETD)', status: 'not_started', sortOrder: 12 },
    { stageCategory: 'shipping', stageCode: 'eta', stageName: '到港 (ETA)', status: 'not_started', sortOrder: 13 },
  ];
  await prisma.orderTaStage.createMany({ data: taStages4.map(s => ({ orderId: order4.id, ...s })) });

  // 操作日志
  await prisma.operationLog.createMany({
    data: [
      { orderId: order1.id, userId: merch1.id, userName: merch1.realName, userRole: 'merchandiser', module: 'ta_stage', action: 'update', changeSummary: '将确认样状态从进行中改为已完成（完成日期: 2026-07-24）' },
      { orderId: order1.id, userId: merch1.id, userName: merch1.realName, userRole: 'merchandiser', module: 'ta_stage', action: 'update', changeSummary: '将裁剪 (Cutting) 状态从进行中改为已完成（完成日期: 2026-07-30）' },
      { orderId: order1.id, userId: coordinator1.id, userName: coordinator1.realName, userRole: 'coordinator', module: 'fabric', action: 'update', changeSummary: '面料全棉汗布已到厂，数量核对正确（2026-07-18）' },
      { orderId: order1.id, userId: admin.id, userName: admin.realName, userRole: 'admin', module: 'trim', action: 'update', changeSummary: '辅料纽扣大货状态更新为生产中（2026-08-06）' },
      { orderId: order2.id, userId: merch2.id, userName: merch2.realName, userRole: 'merchandiser', module: 'ta_stage', action: 'update', changeSummary: '将初样 (Proto) 状态从进行中改为已完成（完成日期: 2026-07-28）' },
      { orderId: order3.id, userId: admin.id, userName: admin.realName, userRole: 'admin', module: 'order', action: 'create', changeSummary: '创建订单 PO-2026-0003' },
      { orderId: order4.id, userId: admin.id, userName: admin.realName, userRole: 'admin', module: 'order', action: 'create', changeSummary: '创建订单 PO-2026-0004，分配理单李理单，跟单张跟单' },
    ],
  });

  console.log('种子数据初始化完成！');
  console.log(`演示公司: ${company.code} (${company.name})`);
  console.log('可用账号: admin/liwen/wangli/chenli/zhanggen/liugen/zhaogen/john, 密码: 123456');
}

function TA_STAGE_TEMPLATES() {
  return [
    { stageCategory: 'sampling', stageCode: 'proto', stageName: '初样 (Proto)', sortOrder: 1 },
    { stageCategory: 'sampling', stageCode: 'pps', stageName: '产前样 (PPS)', sortOrder: 2 },
    { stageCategory: 'sampling', stageCode: 'confirmed', stageName: '确认样', sortOrder: 3 },
    { stageCategory: 'production', stageCode: 'cutting', stageName: '裁剪 (Cutting)', sortOrder: 4 },
    { stageCategory: 'production', stageCode: 'sewing', stageName: '车缝 (Sewing)', sortOrder: 5 },
    { stageCategory: 'production', stageCode: 'packing', stageName: '后整包装 (Packing)', sortOrder: 6 },
    { stageCategory: 'inspection', stageCode: 'dupro', stageName: '中期检验 (Dupro)', sortOrder: 7 },
    { stageCategory: 'inspection', stageCode: 'fri', stageName: '尾期检验 (FRI)', sortOrder: 8 },
    { stageCategory: 'inspection', stageCode: 'report', stageName: '验货报告', sortOrder: 9 },
    { stageCategory: 'shipping', stageCode: 'booking', stageName: '订舱', sortOrder: 10 },
    { stageCategory: 'shipping', stageCode: 'loading', stageName: '装柜', sortOrder: 11 },
    { stageCategory: 'shipping', stageCode: 'etd', stageName: '离港 (ETD)', sortOrder: 12 },
    { stageCategory: 'shipping', stageCode: 'eta', stageName: '到港 (ETA)', sortOrder: 13 },
  ];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
