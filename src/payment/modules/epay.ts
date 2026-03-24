import crypto from 'crypto';
import axios from 'axios';
import type {
 IPaymentModule,
 PaymentModuleConfig,
 PaymentChannel,
 PaymentRequest,
 PaymentResponse,
 PaymentNotification,
} from '../types.js';

interface EpayConfig {
 pid: string;
 key: string;
 apiUrl: string;
 notifyUrl?: string;
 returnUrl?: string;
}

interface OrderQueryResponse {
 code: number;
 msg?: string;
 trade_no?: string;
 out_trade_no?: string;
 trade_status?: string;
 money?: number;
 type?: string;
 name?: string;
 create_time?: number;
 pay_time?: number;
}

interface RefundResponse {
 code: number;
 msg?: string;
 refund_no?: string;
 out_refund_no?: string;
 refund_status?: string;
}

export class EpayModule implements IPaymentModule {
 name = 'epay';
 version = '1.0.0';

 private config: EpayConfig | null = null;
 private channels: PaymentChannel[] = [];
 private orderCache: Map<string, any> = new Map();

 async initialize(config: PaymentModuleConfig): Promise<void> {
 if (!config.config.pid) {
 throw new Error('Missing required config: pid');
 }

 this.config = {
 pid: config.config.pid,
 key: config.config.key || '',
 apiUrl: config.config.apiUrl || 'https://pay.521cd.cn',
 notifyUrl: config.config.notifyUrl,
 returnUrl: config.config.returnUrl,
 };

 await this.fetchChannels();
 console.log(`[Epay] Module initialized with PID: ${this.config.pid}`);
 }

 async getChannels(): Promise<PaymentChannel[]> {
 if (this.channels.length >0) return this.channels;
 await this.fetchChannels();
 return this.channels;
 }

 private async fetchChannels(): Promise<void> {
 if (!this.config) return;

 try {
 const timestamp = Math.floor(Date.now() /1000);
 const sign = this.generateSign({
 pid: this.config.pid,
 timestamp: timestamp.toString(),
 });

 const response = await axios.post(
 `${this.config.apiUrl}/xpay/user-channels`,
 { pid: this.config.pid, timestamp, sign },
 { timeout:5000 }
 );

 if (response.data && Array.isArray(response.data)) {
 this.channels = response.data.map((ch: any) => ({
 id: ch.id,
 name: ch.name,
 code: ch.code,
 payType: ch.pay_type,
 remark: ch.remark,
 minAmount: ch.min_amount,
 maxAmount: ch.max_amount,
 dayAmount: ch.day_amount,
 }));
 console.log(`[Epay] Fetched ${this.channels.length} payment channels`);
 }
 } catch (error) {
 console.warn('[Epay] Failed to fetch channels, using defaults:', error);
 this.channels = [
 { id:1, name: '支付宝', code: 'alipay', payType: 'alipay', minAmount:0.01, maxAmount:1000, dayAmount:10000 },
 { id:2, name: '微信支付', code: 'wxpay', payType: 'wxpay', minAmount:0.01, maxAmount:1000, dayAmount:10000 },
 ];
 }
 }

 async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
 if (!this.config) return { code:0, msg: 'Payment module not initialized' };

 try {
 const channel = this.channels.find(ch => ch.code === request.type);
 if (channel) {
 if (request.money < channel.minAmount) return { code:0, msg: `Minimum amount is ${channel.minAmount}` };
 if (request.money > channel.maxAmount) return { code:0, msg: `Maximum amount is ${channel.maxAmount}` };
 }

 let notifyUrl = request.notifyUrl || this.config.notifyUrl || '';
 let returnUrl = request.returnUrl || this.config.returnUrl || '';

 if (request.authToken) {
 const notifyUrlObj = new URL(notifyUrl);
 notifyUrlObj.searchParams.set('token', request.authToken);
 notifyUrl = notifyUrlObj.toString();

 if (returnUrl) {
 const returnUrlObj = new URL(returnUrl);
 returnUrlObj.searchParams.set('token', request.authToken);
 returnUrl = returnUrlObj.toString();
 }
 }

 // 按文档：请求参数不包含 key 字段，key仅参与签名
 const params: Record<string, any> = {
 pid: this.config.pid,
 type: request.type,
 out_trade_no: request.outTradeNo,
 notify_url: notifyUrl,
 return_url: returnUrl,
 name: request.name,
 money: request.money.toFixed(2),
 clientip: request.clientIp,
 device: request.device || 'pc',
 param: request.param,
 channel_id: request.channelId,
 };

 const sign = this.generateSign(params);
 params.sign = sign;
 params.sign_type = 'MD5';

 console.log(`[Epay] Creating payment order: ${request.outTradeNo}, amount: ${request.money}`);
 console.log('[Epay] Sign params:', JSON.stringify(params, null,2));

 const formParams = new URLSearchParams();
 for (const [key, value] of Object.entries(params)) {
 if (value !== null && value !== undefined && value !== '') {
 formParams.append(key, String(value));
 }
 }

 console.log('[Epay] Request body:', formParams.toString());

 const response = await axios.post(
 `${this.config.apiUrl}/xpay/epay/mapi.php`,
 formParams.toString(),
 {
 timeout:10000,
 headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
 }
 );

 console.log('[Epay] Response data:', JSON.stringify(response.data, null,2));

 if (response.data.code ===1) {
 this.orderCache.set(request.outTradeNo, {
 tradeNo: response.data.trade_no,
 outTradeNo: request.outTradeNo,
 money: request.money,
 type: request.type,
 status: 'pending',
 createdAt: Date.now(),
 });

 let payUrl = response.data.payurl;
 let qrCode = response.data.qrcode;

 if (!payUrl && !qrCode && response.data.trade_no) {
 payUrl = `${this.config.apiUrl}/pay/${response.data.trade_no}`;
 console.log(`[Epay] Constructed payUrl from trade_no: ${payUrl}`);
 }

 return {
 code:1,
 msg: 'Success',
 tradeNo: response.data.trade_no,
 payUrl,
 qrCode,
 urlScheme: response.data.urlscheme,
 money: request.money,
 };
 }

 console.warn(`[Epay] Payment request failed: ${response.data.msg}`);
 return { code:0, msg: response.data.msg || 'Payment request failed' };
 } catch (error: any) {
 console.error('[Epay] Payment request error:', error.message);
 return { code:0, msg: error.message || 'Payment request failed' };
 }
 }

 verifyNotification(notification: PaymentNotification | Record<string, any>): boolean {
 if (!this.config) return false;

 const pick = (v: any) => (Array.isArray(v) ? v[0] : v);

 const raw = notification as Record<string, any>;
 let source: Record<string, any> = raw;

 // 部分网关会把通知内容放到 data 字段里（JSON 字符串）
 if (typeof raw.data === 'string' && raw.data.trim()) {
 try {
 const parsed = JSON.parse(raw.data);
 if (parsed && typeof parsed === 'object') {
 source = parsed;
 }
 } catch {
 // ignore parse error and fall back to raw payload
 }
 }

 const receivedSign = String(pick(source.sign) || '').toLowerCase();
 if (!receivedSign) {
 console.warn('[Epay] Missing signature in notification');
 return false;
 }

 // 按签名规则：除 sign/sign_type以外，使用通知中实际存在的字段参与签名
 const signParams: Record<string, any> = {};
 for (const [key, value] of Object.entries(source)) {
 if (key === 'sign' || key === 'sign_type' || key === 'token' || key === 'module') {
 continue;
 }
 const val = pick(value);
 if (val !== '' && val !== null && val !== undefined && val !== false) {
 signParams[key] = val;
 }
 }

 const expectedSign = this.generateSign(signParams).toLowerCase();
 const isValid = expectedSign === receivedSign;

 if (!isValid) {
 const outTradeNo = String(signParams.out_trade_no ?? signParams.outTradeNo ?? 'unknown');
 console.warn(`[Epay] Invalid signature for order: ${outTradeNo}`);
 console.warn(`[Epay] Verify keys: ${Object.keys(signParams).sort().join(',') || '(none)'}`);
 console.warn(`[Epay] Expected sign: ${expectedSign}, received: ${receivedSign}`);
 }

 return isValid;
 }


 async queryOrder(outTradeNo: string): Promise<{ status: 'pending' | 'success' | 'failed' | 'unknown'; tradeNo?: string; money?: number }> {
 if (!this.config) return { status: 'unknown' };

 try {
 const cachedOrder = this.orderCache.get(outTradeNo);
 if (cachedOrder) {
 console.log(`[Epay] Order found in cache: ${outTradeNo}`);
 return { status: cachedOrder.status, tradeNo: cachedOrder.tradeNo, money: cachedOrder.money };
 }

 const timestamp = Math.floor(Date.now() /1000);
 const params: Record<string, any> = {
 pid: this.config.pid,
 out_trade_no: outTradeNo,
 timestamp: timestamp.toString(),
 };

 params.sign = this.generateSign(params);

 const response = await axios.post(`${this.config.apiUrl}/xpay/epay/query.php`, params, { timeout:5000 });
 const data: OrderQueryResponse = response.data;

 if (data.code ===1) {
 const status = data.trade_status === 'TRADE_SUCCESS' ? 'success' : 'pending';
 this.orderCache.set(outTradeNo, {
 tradeNo: data.trade_no,
 outTradeNo: data.out_trade_no,
 money: data.money,
 type: data.type,
 status,
 createdAt: data.create_time,
 paidAt: data.pay_time,
 });

 console.log(`[Epay] Order query result: ${outTradeNo}, status: ${status}`);
 return { status, tradeNo: data.trade_no, money: data.money };
 }

 console.warn(`[Epay] Order query failed: ${data.msg}`);
 return { status: 'unknown' };
 } catch (error: any) {
 console.error('[Epay] Order query error:', error.message);
 return { status: 'unknown' };
 }
 }

 async closeOrder(outTradeNo: string): Promise<void> {
 if (!this.config) return;

 try {
 const timestamp = Math.floor(Date.now() /1000);
 const params: Record<string, any> = {
 pid: this.config.pid,
 out_trade_no: outTradeNo,
 timestamp: timestamp.toString(),
 };

 params.sign = this.generateSign(params);
 console.log(`[Epay] Closing order: ${outTradeNo}`);

 const response = await axios.post(`${this.config.apiUrl}/xpay/epay/close.php`, params, { timeout:5000 });
 if (response.data.code ===1) {
 const cachedOrder = this.orderCache.get(outTradeNo);
 if (cachedOrder) cachedOrder.status = 'failed';
 console.log(`[Epay] Order closed successfully: ${outTradeNo}`);
 } else {
 console.warn(`[Epay] Close order failed: ${response.data.msg}`);
 }
 } catch (error: any) {
 console.error('[Epay] Close order error:', error.message);
 }
 }

 async refund(outTradeNo: string, refundAmount: number): Promise<{ status: 'success' | 'failed'; refundNo?: string }> {
 if (!this.config) return { status: 'failed' };

 try {
 const order = this.orderCache.get(outTradeNo);
 if (!order) {
 console.warn(`[Epay] Order not found for refund: ${outTradeNo}`);
 return { status: 'failed' };
 }

 if (refundAmount > order.money) {
 console.warn(`[Epay] Refund amount exceeds order amount: ${refundAmount} > ${order.money}`);
 return { status: 'failed' };
 }

 const timestamp = Math.floor(Date.now() /1000);
 const outRefundNo = `${outTradeNo}_${timestamp}`;
 const params: Record<string, any> = {
 pid: this.config.pid,
 out_trade_no: outTradeNo,
 out_refund_no: outRefundNo,
 refund_amount: refundAmount.toFixed(2),
 timestamp: timestamp.toString(),
 };

 params.sign = this.generateSign(params);
 console.log(`[Epay] Processing refund: ${outTradeNo}, amount: ${refundAmount}`);

 const response = await axios.post(`${this.config.apiUrl}/xpay/epay/refund.php`, params, { timeout:10000 });
 const data: RefundResponse = response.data;

 if (data.code ===1) {
 console.log(`[Epay] Refund successful: ${data.refund_no}`);
 return { status: 'success', refundNo: data.refund_no };
 }

 console.warn(`[Epay] Refund failed: ${data.msg}`);
 return { status: 'failed' };
 } catch (error: any) {
 console.error('[Epay] Refund error:', error.message);
 return { status: 'failed' };
 }
 }

 private generateSign(params: Record<string, any>): string {
 if (!this.config) return '';

 const filtered: Record<string, any> = {};
 for (const [key, value] of Object.entries(params)) {
 if (key !== 'sign' && key !== 'sign_type') {
 if (value !== '' && value !== null && value !== undefined && value !== false) {
 filtered[key] = value;
 }
 }
 }

 const sortedKeys = Object.keys(filtered).sort((a, b) => (a < b ? -1 : a > b ?1 :0));
 const stringA = sortedKeys.map(key => `${key}=${filtered[key]}`).join('&');
 const stringSignTemp = stringA + this.config.key;
 const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex');

 console.log(`[Epay] Sign string: ${stringA}`);
 console.log(`[Epay] Sign with key: ${stringSignTemp}`);
 console.log(`[Epay] Generated sign: ${sign}`);

 return sign;
 }

 getCachedOrder(outTradeNo: string): any {
 return this.orderCache.get(outTradeNo);
 }

 cleanupExpiredOrders(): void {
 const now = Date.now();
 const maxAge =24 *60 *60 *1000;

 for (const [key, order] of this.orderCache.entries()) {
 if (now - order.createdAt > maxAge) {
 this.orderCache.delete(key);
 }
 }

 console.log(`[Epay] Cleaned up expired orders, remaining: ${this.orderCache.size}`);
 }

 getCacheStats(): { totalOrders: number; pendingOrders: number; successOrders: number; failedOrders: number } {
 let pendingOrders =0;
 let successOrders =0;
 let failedOrders =0;

 for (const order of this.orderCache.values()) {
 if (order.status === 'pending') pendingOrders++;
 else if (order.status === 'success') successOrders++;
 else if (order.status === 'failed') failedOrders++;
 }

 return {
 totalOrders: this.orderCache.size,
 pendingOrders,
 successOrders,
 failedOrders,
 };
 }
}
