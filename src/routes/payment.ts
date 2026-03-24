/**
 * 支付和兑换码相关的 API 路由
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getUserById, updateUser } from '../storage.js';
import { paymentModuleManager } from '../payment/moduleManager.js';
import type { RedeemCodeManager } from '../payment/redeemCodeManager.js';
import * as paymentOrdersDB from '../db/paymentOrders.js';

export function createPaymentRoutes(redeemCodeManager: RedeemCodeManager): RouterType {
 const router: RouterType = Router();

 /**
 * GET /api/payment/modules - 获取已注册的支付模块列表（无需认证）
 */
 router.get('/modules', (req: Request, res: Response) => {
 const modules = paymentModuleManager.getModules().map((m: any) => ({
 name: m.name,
 version: m.version,
 }));

 res.json({ modules });
 });

 /**
 * GET /api/payment/orders - 获取用户的支付订单列表
 */
 router.get('/orders', async (req: Request, res: Response) => {
 const userId = (req as any).userId || (req as any).user?.userId;
 if (!userId) {
 return res.status(401).json({ error: 'Unauthorized' });
 }

 try {
 const status = req.query.status as paymentOrdersDB.PaymentOrderStatus | undefined;
 const limit = parseInt(req.query.limit as string) ||50;
 const skip = parseInt(req.query.skip as string) ||0;

 const orders = await paymentOrdersDB.getPaymentOrdersByUserId(userId, {
 status,
 limit,
 skip,
 });

 const total = await paymentOrdersDB.countPaymentOrdersByUserId(userId, status);

 res.json({
 orders,
 total,
 limit,
 skip,
 });
 } catch (error: any) {
 console.error('[Payment] Get orders error:', error);
 res.status(500).json({ error: error.message });
 }
 });

 /**
 * GET /api/payment/orders/:outTradeNo - 获取单个订单详情
 */
 router.get('/orders/:outTradeNo', async (req: Request, res: Response) => {
 const userId = (req as any).userId || (req as any).user?.userId;
 if (!userId) {
 return res.status(401).json({ error: 'Unauthorized' });
 }

 try {
 const outTradeNo = Array.isArray(req.params.outTradeNo) ? req.params.outTradeNo[0] : req.params.outTradeNo;
 const order = await paymentOrdersDB.getPaymentOrderByOutTradeNo(outTradeNo);

 if (!order) {
 return res.status(404).json({ error: 'Order not found' });
 }

 // 验证订单属于当前用户
 if (order.userId !== userId) {
 return res.status(403).json({ error: 'Access denied' });
 }

 res.json({ order });
 } catch (error: any) {
 console.error('[Payment] Get order error:', error);
 res.status(500).json({ error: error.message });
 }
 });

 /**
 * POST /api/payment/redeem -兑换码兑换
 */
 router.post('/redeem', async (req: Request, res: Response) => {
 const userId = (req as any).userId || (req as any).user?.userId;
 if (!userId) {
 return res.status(401).json({ error: 'Unauthorized' });
 }

 const { code } = req.body;
 if (!code || typeof code !== 'string') {
 return res.status(400).json({ error: 'Invalid redeem code' });
 }

 try {
 // 验证并使用兑换码
 const result = await redeemCodeManager.redeemCode(code, userId);

 if (!result.success) {
 return res.status(400).json({ error: result.error });
 }

 // 更新用户余额
 const user = getUserById(userId);
 if (!user) {
 return res.status(404).json({ error: 'User not found' });
 }

 const newBalance = (user.balance ||0) + (result.amount ||0);
 updateUser(userId, { balance: newBalance });

 res.json({
 success: true,
 amount: result.amount,
 newBalance,
 message: `Successfully redeemed ${result.amount} credits`,
 });
 } catch (error: any) {
 res.status(500).json({ error: error.message });
 }
 });

 /**
 * GET /api/payment/channels - 获取支付渠道列表
 */
 router.get('/channels', async (req: Request, res: Response) => {
 const moduleName = (req.query.module as string) || 'epay';
 const module = paymentModuleManager.getModule(moduleName);

 if (!module) {
 return res.status(400).json({ error: `Payment module '${moduleName}' not found` });
 }

 try {
 const channels = await module.getChannels();
 res.json({ channels });
 } catch (error: any) {
 res.status(500).json({ error: error.message });
 }
 });

 /**
 * POST /api/payment/create - 创建支付订单
 */
 router.post('/create', async (req: Request, res: Response) => {
 const userId = (req as any).userId || (req as any).user?.userId;
 if (!userId) {
 return res.status(401).json({ error: 'Unauthorized' });
 }

 const { moduleName = 'epay', type, name, money, param } = req.body;

 if (!type || !name || !money || money <=0) {
 return res.status(400).json({ error: 'Invalid payment parameters' });
 }

 const module = paymentModuleManager.getModule(moduleName);
 if (!module) {
 return res.status(400).json({ error: `Payment module '${moduleName}' not found` });
 }

 try {
 //生成商户订单号
 const outTradeNo = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;

 // 获取客户端 IP
 const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';
 const device = req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'pc';

 // 获取 auth token 用于回调 URL认证
 const authToken = (req.headers.authorization as string)?.replace('Bearer ', '') || '';

 // 创建支付请求
 const paymentResponse = await module.createPayment({
 outTradeNo,
 name,
 money,
 type,
 clientIp,
 device,
 param: param ? JSON.stringify({ userId, ...param }) : JSON.stringify({ userId }),
 authToken,
 });

 if (paymentResponse.code ===1) {
 // 保存订单记录到数据库
 await paymentOrdersDB.createPaymentOrder({
 userId,
 outTradeNo,
 money,
 type,
 status: 'pending',
 moduleName,
 payUrl: paymentResponse.payUrl,
 qrCode: paymentResponse.qrCode,
 clientIp,
 device,
 remark: name,
 expiredAt: Date.now() +24 *60 *60 *1000,
 createdAt: Date.now(),
 });

 res.json({
 success: true,
 outTradeNo,
 ...paymentResponse,
 });
 } else {
 res.status(400).json({
 error: paymentResponse.msg || 'Payment creation failed',
 });
 }
 } catch (error: any) {
 console.error('[Payment] Create order error:', error);
 res.status(500).json({ error: error.message });
 }
 });

 /**
 * /api/payment/notify - 支付通知回调（支持 GET/POST）
 */
 const notifyHandler = async (req: Request, res: Response) => {
 const moduleName = (req.query.module as string) || 'epay';
 const module = paymentModuleManager.getModule(moduleName);

 if (!module) {
 return res.status(400).json({ error: `Payment module '${moduleName}' not found` });
 }

 try {
 const payload: any = req.method === 'GET' ? req.query : req.body;
 const pick = (v: any) => (Array.isArray(v) ? v[0] : v);

 if (!module.verifyNotification(payload)) {
 return res.status(400).json({ error: 'Invalid signature' });
 }

 if (pick(payload.trade_status) !== 'TRADE_SUCCESS') {
 return res.status(400).json({ error: 'Payment not successful' });
 }

 const outTradeNo = pick(payload.out_trade_no);
 const tradeNo = pick(payload.trade_no);

 const existingOrder = await paymentOrdersDB.getPaymentOrderByOutTradeNo(outTradeNo);
 if (!existingOrder) {
 console.error('[Payment] Order not found:', outTradeNo);
 return res.status(404).json({ error: 'Order not found' });
 }

 if (existingOrder.status === 'paid') {
 return res.send('success');
 }

 let userId: string | null = null;
 const rawParam = pick(payload.param);
 try {
 const parsed = JSON.parse(rawParam || '{}');
 userId = parsed.userId;
 } catch {
 userId = rawParam;
 }

 if (!userId) {
 return res.status(400).json({ error: 'Missing userId in payment param' });
 }

 await paymentOrdersDB.updatePaymentOrderStatus(outTradeNo, {
 status: 'paid',
 tradeNo,
 paidAt: Date.now(),
 });

 const user = getUserById(userId);
 if (!user) {
 return res.status(404).json({ error: 'User not found' });
 }

 const amount = parseFloat(String(pick(payload.money)));
 const newBalance = (user.balance ||0) + amount;
 updateUser(userId, { balance: newBalance });

 console.log(`[Payment] Order ${outTradeNo} paid, user ${userId} balance +${amount}`);
 res.send('success');
 } catch (error: any) {
 console.error('[Payment] Notification error:', error);
 res.status(500).json({ error: error.message });
 }
 };

 router.get('/notify', notifyHandler);
 router.post('/notify', notifyHandler);

 return router;
}
