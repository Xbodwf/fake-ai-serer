// 测试节点 WebSocket 连接
const WebSocket = require('ws');
require('dotenv').config();

// 配置
const SERVER_URL = 'ws://localhost:7143/node/ws';
const NODE_KEY = 'node-3zdPoiaqvunnNnJCR8IvH6JTzWU9GtoI';

console.log('=== 节点 WebSocket 连接测试 ===');
console.log('服务器地址:', SERVER_URL);
console.log('节点 Key:', NODE_KEY);

// 连接 WebSocket
console.log('\n[WebSocket] 正在连接...');
const ws = new WebSocket(SERVER_URL, {
  headers: {
    'Authorization': `Bearer ${NODE_KEY}`
  }
});

ws.on('open', () => {
  console.log('[WebSocket] 连接已建立!');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('[WebSocket] 收到消息:', JSON.stringify(msg, null, 2));
  } catch (e) {
    console.log('[WebSocket] 收到原始消息:', data.toString());
  }
});

ws.on('close', (code, reason) => {
  console.log('[WebSocket] 连接已关闭');
  console.log('  关闭码:', code);
  console.log('  原因:', reason.toString() || '(无)');
  
  const closeCodes = {
    1000: '正常关闭',
    1001: '终端离开',
    1002: '协议错误',
    1003: '不支持的数据类型',
    1006: '异常关闭（无关闭帧）',
    1007: '数据类型不一致',
    1008: '策略违规（通常是认证失败）',
    1009: '消息过大',
    1010: '缺少扩展',
    1011: '内部错误',
    1015: 'TLS握手失败',
  };
  console.log('  说明:', closeCodes[code] || '未知');
});

ws.on('error', (error) => {
  console.error('[WebSocket] 错误:', error.message);
});

// 心跳
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] 发送心跳...');
    ws.send(JSON.stringify({ type: 'node-heartbeat', payload: {} }));
  }
}, 30000);

// 30秒后自动退出
setTimeout(() => {
  console.log('\n[测试] 30秒超时，退出测试');
  ws.close();
  process.exit(0);
}, 30000);