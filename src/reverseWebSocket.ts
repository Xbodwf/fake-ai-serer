import { WebSocketServer, WebSocket } from 'ws';
import type { WSMessage, PendingRequest, Model } from './types.js';
import { addPendingRequest, getPendingRequest, removePendingRequest, getAllPendingRequests } from './requestStore.js';

let reverseWss: WebSocketServer;
const reverseClients = new Map<string, WebSocket>(); // clientId -> WebSocket
const clientCapabilities = new Map<string, string[]>(); // clientId -> capabilities

/**
 * 初始化反向 WebSocket 服务
 * 客户端连接到这个服务可以注册为反向客户端，服务器会通过这个连接发送请求
 */
export function initReverseWebSocket(server: import('http').Server, path: string = '/reverse-ws') {
  reverseWss = new WebSocketServer({ server, path });
  
  console.log(`[Reverse WS] 反向 WebSocket 服务已启动，路径: ${path}`);

  reverseWss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[Reverse WS] 新的反向连接来自: ${clientIp}`);

    // 发送连接确认
    const connectMsg: WSMessage = {
      type: 'connected',
      payload: { message: '已连接到反向 WebSocket 服务' }
    };
    ws.send(JSON.stringify(connectMsg));

    ws.on('message', (data) => {
      try {
        const msg: WSMessage = JSON.parse(data.toString());
        handleReverseClientMessage(ws, msg);
      } catch (e) {
        console.error('[Reverse WS] 解析消息失败:', e);
      }
    });

    ws.on('close', () => {
      // 查找并移除断开连接的客户端
      for (const [clientId, clientWs] of reverseClients.entries()) {
        if (clientWs === ws) {
          reverseClients.delete(clientId);
          clientCapabilities.delete(clientId);
          console.log(`[Reverse WS] 反向客户端 ${clientId} 已断开`);
          break;
        }
      }
      console.log(`[Reverse WS] 反向连接已断开，当前反向客户端数: ${reverseClients.size}`);
    });

    ws.on('error', (error) => {
      console.error('[Reverse WS] WebSocket 错误:', error.message);
    });
  });

  return reverseWss;
}

/**
 * 处理反向客户端的消息
 */
function handleReverseClientMessage(ws: WebSocket, msg: WSMessage) {
  switch (msg.type) {
    case 'reverse-connect':
      handleReverseConnect(ws, msg);
      break;
    
    case 'response':
    case 'stream':
    case 'stream_end':
    case 'image_response':
    case 'video_response':
      handleReverseResponse(msg);
      break;
    
    case 'reverse-disconnect':
      handleReverseDisconnect(ws);
      break;
    
    default:
      console.log(`[Reverse WS] 收到未知消息类型: ${msg.type}`);
  }
}

/**
 * 处理反向连接注册
 */
function handleReverseConnect(ws: WebSocket, msg: WSMessage) {
  const payload = msg.payload as { clientId?: string; capabilities?: string[]; maxConcurrentRequests?: number };
  const clientId = payload.clientId || `reverse-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 检查是否已存在相同 clientId 的连接
  if (reverseClients.has(clientId)) {
    console.log(`[Reverse WS] 客户端 ${clientId} 已存在，替换旧连接`);
  }
  
  // 注册客户端
  reverseClients.set(clientId, ws);
  clientCapabilities.set(clientId, payload.capabilities || []);
  
  console.log(`[Reverse WS] 反向客户端 ${clientId} 已注册，能力: ${payload.capabilities?.join(', ') || '无'}`);
  
  // 发送确认消息
  const ackMsg: WSMessage = {
    type: 'reverse-connect-ack',
    payload: {
      success: true,
      clientId,
      message: '反向连接注册成功'
    }
  };
  ws.send(JSON.stringify(ackMsg));
  
  // 如果有待处理的请求，发送给新连接的反向客户端
  const pending = getAllPendingRequests();
  if (pending.length > 0) {
    console.log(`[Reverse WS] 向新客户端 ${clientId} 发送 ${pending.length} 个待处理请求`);
    pending.forEach((req) => {
      sendRequestToReverseClient(clientId, req);
    });
  }
}

/**
 * 处理反向客户端的响应
 */
function handleReverseResponse(msg: WSMessage) {
  const payload = msg.payload as { requestId: string; content: string; images?: any[]; videos?: any[] };
  const req = getPendingRequest(payload.requestId);

  if (!req) {
    console.warn('[Reverse WS] 未找到请求:', payload.requestId);
    return;
  }

  if (msg.type === 'response') {
    // 非流式响应
    req.resolve(payload.content);
    removePendingRequest(payload.requestId);
    console.log('[Reverse WS] 请求已处理:', payload.requestId);
  } else if (msg.type === 'stream') {
    // 流式响应 - 发送块
    if (req.streamController) {
      req.streamController.enqueue(payload.content);
    }
  } else if (msg.type === 'stream_end') {
    // 流式结束
    if (req.streamController) {
      req.streamController.close();
    }
    removePendingRequest(payload.requestId);
    console.log('[Reverse WS] 流式请求已完成:', payload.requestId);
  } else if (msg.type === 'image_response') {
    // 图片响应
    req.resolve(JSON.stringify(payload.images || []));
    removePendingRequest(payload.requestId);
    console.log('[Reverse WS] 图片请求已处理:', payload.requestId);
  } else if (msg.type === 'video_response') {
    // 视频响应
    req.resolve(JSON.stringify(payload.videos || []));
    removePendingRequest(payload.requestId);
    console.log('[Reverse WS] 视频请求已处理:', payload.requestId);
  }
}

/**
 * 处理反向客户端断开
 */
function handleReverseDisconnect(ws: WebSocket) {
  // 查找并移除客户端
  for (const [clientId, clientWs] of reverseClients.entries()) {
    if (clientWs === ws) {
      reverseClients.delete(clientId);
      clientCapabilities.delete(clientId);
      console.log(`[Reverse WS] 反向客户端 ${clientId} 主动断开`);
      break;
    }
  }
}

/**
 * 发送请求到指定的反向客户端
 */
export function sendRequestToReverseClient(clientId: string, req: PendingRequest): boolean {
  const ws = reverseClients.get(clientId);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn(`[Reverse WS] 反向客户端 ${clientId} 不可用`);
    return false;
  }

  const msg: WSMessage = {
    type: 'request',
    payload: {
      requestId: req.requestId,
      data: req.request,
      requestParams: req.requestParams,
      requestType: req.requestType,
      imageRequest: req.imageRequest,
      videoRequest: req.videoRequest,
    }
  };

  try {
    ws.send(JSON.stringify(msg));
    console.log(`[Reverse WS] 请求 ${req.requestId} 已发送到反向客户端 ${clientId}`);
    return true;
  } catch (error) {
    console.error(`[Reverse WS] 发送请求到 ${clientId} 失败:`, error);
    return false;
  }
}

/**
 * 广播请求到所有反向客户端
 */
export function broadcastRequestToReverseClients(req: PendingRequest): number {
  const msg: WSMessage = {
    type: 'request',
    payload: {
      requestId: req.requestId,
      data: req.request,
      requestParams: req.requestParams,
      requestType: req.requestType,
      imageRequest: req.imageRequest,
      videoRequest: req.videoRequest,
    }
  };
  const data = JSON.stringify(msg);

  let sentCount = 0;
  reverseClients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(data);
        sentCount++;
      } catch (error) {
        console.error(`[Reverse WS] 发送请求到 ${clientId} 失败:`, error);
      }
    }
  });

  console.log(`[Reverse WS] 已广播请求到 ${sentCount} 个反向客户端`);
  return sentCount;
}

/**
 * 获取第一个可用的反向客户端
 */
export function getFirstAvailableReverseClient(): string | null {
  for (const [clientId, ws] of reverseClients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      return clientId;
    }
  }
  return null;
}

/**
 * 获取所有反向客户端ID
 */
export function getAllReverseClientIds(): string[] {
  return Array.from(reverseClients.keys());
}

/**
 * 获取反向客户端数量
 */
export function getReverseClientCount(): number {
  return reverseClients.size;
}

/**
 * 获取反向客户端的连接状态
 */
export function getReverseClientStatus(clientId: string): { connected: boolean; capabilities: string[] } {
  const ws = reverseClients.get(clientId);
  return {
    connected: ws !== undefined && ws.readyState === WebSocket.OPEN,
    capabilities: clientCapabilities.get(clientId) || []
  };
}

/**
 * 检查是否有反向客户端可用
 */
export function hasReverseClients(): boolean {
  return reverseClients.size > 0;
}