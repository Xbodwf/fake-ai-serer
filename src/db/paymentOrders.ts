import { toEntity, toEntities } from './utils';
import { getDB } from './connection';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'payment_orders';

// 支付订单状态
export type PaymentOrderStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'closed';

// 支付订单记录
export interface PaymentOrder {
  id: string;
  _id?: ObjectId;
  userId: string;                    // 用户ID
  outTradeNo: string;                // 商户订单号
  tradeNo?: string;                  // 第三方支付订单号
  money: number;                     // 支付金额
  type: string;                      // 支付类型 (alipay, wxpay 等)
  status: PaymentOrderStatus;        // 订单状态
  moduleName: string;                // 支付模块名称 (epay 等)
  payUrl?: string;                   // 支付链接
  qrCode?: string;                   // 二维码链接
  paidAt?: number;                   // 支付时间
  expiredAt?: number;                // 过期时间
  createdAt: number;                 // 创建时间
  updatedAt?: number;                // 更新时间
  clientIp?: string;                 // 客户端IP
  device?: string;                   // 设备类型
  remark?: string;                   // 备注
}

// 创建支付订单索引
export async function createPaymentOrderIndexes(): Promise<void> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  // 创建唯一索引
  await collection.createIndex({ outTradeNo: 1 }, { unique: true });
  await collection.createIndex({ userId: 1, createdAt: -1 });
  await collection.createIndex({ status: 1 });
}

// 创建支付订单
export async function createPaymentOrder(order: Omit<PaymentOrder, 'id' | '_id'>): Promise<PaymentOrder> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = {
    ...order,
    _id: new ObjectId(),
    createdAt: order.createdAt || Date.now(),
  };

  await collection.insertOne(doc);
  return toEntity<PaymentOrder>(doc);
}

// 根据商户订单号获取订单
export async function getPaymentOrderByOutTradeNo(outTradeNo: string): Promise<PaymentOrder | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const doc = await collection.findOne({ outTradeNo });
  if (!doc) return null;
  return toEntity<PaymentOrder>(doc);
}

// 更新订单状态
export async function updatePaymentOrderStatus(
  outTradeNo: string,
  update: {
    status: PaymentOrderStatus;
    tradeNo?: string;
    paidAt?: number;
    remark?: string;
  }
): Promise<PaymentOrder | null> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const updateDoc: any = {
    status: update.status,
    updatedAt: Date.now(),
  };

  if (update.tradeNo) updateDoc.tradeNo = update.tradeNo;
  if (update.paidAt) updateDoc.paidAt = update.paidAt;
  if (update.remark) updateDoc.remark = update.remark;

  const result = await collection.findOneAndUpdate(
    { outTradeNo },
    { $set: updateDoc },
    { returnDocument: 'after' }
  );

  if (!result) return null;
  return toEntity<PaymentOrder>(result);
}

// 获取用户的支付订单列表
export async function getPaymentOrdersByUserId(
  userId: string,
  options?: {
    status?: PaymentOrderStatus;
    limit?: number;
    skip?: number;
  }
): Promise<PaymentOrder[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const query: any = { userId };
  if (options?.status) {
    query.status = options.status;
  }

  const cursor = collection
    .find(query)
    .sort({ createdAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 50);

  return toEntities<PaymentOrder>(await cursor.toArray());
}

// 统计用户订单数量
export async function countPaymentOrdersByUserId(
  userId: string,
  status?: PaymentOrderStatus
): Promise<number> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const query: any = { userId };
  if (status) {
    query.status = status;
  }

  return collection.countDocuments(query);
}

// 获取所有订单（管理员用）
export async function getAllPaymentOrders(
  options?: {
    status?: PaymentOrderStatus;
    userId?: string;
    limit?: number;
    skip?: number;
  }
): Promise<PaymentOrder[]> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const query: any = {};
  if (options?.status) query.status = options.status;
  if (options?.userId) query.userId = options.userId;

  const cursor = collection
    .find(query)
    .sort({ createdAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 100);

  return toEntities<PaymentOrder>(await cursor.toArray());
}

// 关闭过期订单
export async function closeExpiredOrders(): Promise<number> {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);

  const now = Date.now();
  const result = await collection.updateMany(
    {
      status: 'pending',
      expiredAt: { $lt: now }
    },
    {
      $set: {
        status: 'expired',
        updatedAt: now
      }
    }
  );

  return result.modifiedCount;
}
