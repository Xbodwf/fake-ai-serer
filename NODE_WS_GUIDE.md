# 节点 WebSocket 连接指南

本文档介绍如何使用 Node.js 实现一个连接到 Phantom Mock 服务器的节点客户端。

## 目录

- [概述](#概述)
- [连接端点](#连接端点)
- [认证](#认证)
- [消息格式](#消息格式)
- [心跳机制](#心跳机制)
- [处理请求](#处理请求)
- [发送响应](#发送响应)
- [完整示例](#完整示例)

## 概述

节点（Node）是一个可以通过 WebSocket 连接到 Phantom Mock 服务器的客户端，用于处理 API 请求。服务器会将请求转发给连接的节点，节点处理完成后将响应返回给服务器。

### 使用场景

- 分布式推理服务
- 自建 GPU 节点
- 边缘计算节点
- 自定义 AI 后端

## 连接端点

WebSocket 端点：`/node/ws`

完整 URL 格式：
```
ws://your-server:port/node/ws
wss://your-server:port/node/ws  (HTTPS)
```

## 认证

节点连接需要使用 JWT Token 进行认证。Token 可以通过管理员控制台生成。

### 认证方式

有两种方式传递 Token：

#### 1. Authorization Header（推荐）

```javascript
const ws = new WebSocket('ws://your-server:port/node/ws', {
  headers: {
    'Authorization': 'Bearer <your-node-token>'
  }
});
```

#### 2. Query Parameter

```javascript
const ws = new WebSocket('ws://your-server:port/node/ws?token=<your-node-token>');
```

### Token 验证失败

如果 Token 无效或缺失，服务器会关闭连接并返回状态码 `1008`：

```javascript
ws.on('close', (code, reason) => {
  if (code === 1008) {
    console.error('认证失败:', reason.toString());
  }
});
```

## 消息格式

所有消息均为 JSON 格式。

### 服务器 -> 节点

#### 连接确认

连接成功后，服务器会发送确认消息：

```json
{
  "type": "node-connect-ack",
  "payload": {
    "success": true,
    "nodeId": "your-node-id",
    "message": "Node connected",
    "serverTime": 1715000000000
  }
}
```

#### 请求消息

当有 API 请求需要处理时：

```json
{
  "type": "request",
  "payload": {
    "requestId": "req-12345",
    "data": {
      "model": "gpt-4",
      "messages": [
        {"role": "user", "content": "Hello!"}
      ],
      "stream": true
    },
    "requestParams": {
      "temperature": 0.7,
      "max_tokens": 1024
    },
    "requestType": "chat"
  }
}
```

### 节点 -> 服务器

#### 心跳

```json
{
  "type": "node-heartbeat",
  "payload": {}
}
```

#### 响应（非流式）

```json
{
  "type": "response",
  "payload": {
    "requestId": "req-12345",
    "content": "Hello! How can I help you today?"
  }
}
```

#### 流式响应块

```json
{
  "type": "stream",
  "payload": {
    "requestId": "req-12345",
    "content": "Hello"
  }
}
```

#### 流式响应结束

```json
{
  "type": "stream_end",
  "payload": {
    "requestId": "req-12345",
    "content": ""
  }
}
```

## 心跳机制

节点应定期发送心跳消息以保持连接活跃。建议间隔：30 秒。

服务器收到心跳后会：
1. 更新节点的 `lastSeenAt` 时间戳
2. 返回心跳确认

```javascript
// 心跳定时器
function startHeartbeat(ws) {
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'node-heartbeat',
        payload: {}
      }));
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // 30 秒

  return heartbeatInterval;
}
```

## 处理请求

### 请求类型

| requestType | 说明 |
|-------------|------|
| `chat` | 聊天补全请求 |
| `image` | 图片生成请求 |
| `video` | 视频生成请求 |

### 处理聊天请求示例

```javascript
async function handleChatRequest(ws, payload) {
  const { requestId, data, requestParams } = payload;
  const { model, messages, stream } = data;

  try {
    if (stream) {
      // 流式响应
      for await (const chunk of generateStreamResponse(model, messages)) {
        ws.send(JSON.stringify({
          type: 'stream',
          payload: {
            requestId,
            content: chunk
          }
        }));
      }

      // 发送结束标记
      ws.send(JSON.stringify({
        type: 'stream_end',
        payload: {
          requestId,
          content: ''
        }
      }));
    } else {
      // 非流式响应
      const response = await generateResponse(model, messages);
      ws.send(JSON.stringify({
        type: 'response',
        payload: {
          requestId,
          content: response
        }
      }));
    }
  } catch (error) {
    // 发送错误响应
    ws.send(JSON.stringify({
      type: 'response',
      payload: {
        requestId,
        content: JSON.stringify({ error: error.message })
      }
    }));
  }
}
```

## 发送响应

### 非流式响应

```javascript
ws.send(JSON.stringify({
  type: 'response',
  payload: {
    requestId: 'req-12345',
    content: '这是完整的响应内容'
  }
}));
```

### 流式响应

```javascript
// 1. 发送多个 stream 消息
ws.send(JSON.stringify({
  type: 'stream',
  payload: { requestId: 'req-12345', content: '第一块' }
}));

ws.send(JSON.stringify({
  type: 'stream',
  payload: { requestId: 'req-12345', content: '第二块' }
}));

// 2. 发送结束标记
ws.send(JSON.stringify({
  type: 'stream_end',
  payload: { requestId: 'req-12345', content: '' }
}));
```

### 图片响应

```javascript
ws.send(JSON.stringify({
  type: 'image_response',
  payload: {
    requestId: 'req-12345',
    images: [
      { url: 'https://example.com/image1.png' },
      { b64_json: 'base64-encoded-image-data' }
    ]
  }
}));
```

### 视频响应

```javascript
ws.send(JSON.stringify({
  type: 'video_response',
  payload: {
    requestId: 'req-12345',
    videos: [
      { url: 'https://example.com/video1.mp4' }
    ]
  }
}));
```

## 完整示例

### 安装依赖

```bash
npm install ws
```

### 完整代码

```javascript
import WebSocket from 'ws';

// 配置
const SERVER_URL = 'ws://localhost:7143/node/ws';
const NODE_TOKEN = 'your-node-token-here';

class NodeClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.heartbeatTimer = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
  }

  connect() {
    console.log('正在连接到服务器...');

    this.ws = new WebSocket(this.url, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    this.ws.on('open', () => {
      console.log('WebSocket 连接已建立');
      this.reconnectDelay = 1000;
      this.startHeartbeat();
    });

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      } catch (e) {
        console.error('解析消息失败:', e);
      }
    });

    this.ws.on('close', (code, reason) => {
      console.log(`连接已关闭: ${code} - ${reason.toString()}`);
      this.stopHeartbeat();
      
      if (code !== 1008) { // 非认证失败，尝试重连
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket 错误:', error.message);
    });
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'node-connect-ack':
        console.log('节点已确认连接:', msg.payload);
        break;

      case 'node-heartbeat':
        // 心跳响应
        break;

      case 'request':
        this.handleRequest(msg.payload);
        break;

      default:
        console.log('收到未知消息类型:', msg.type);
    }
  }

  async handleRequest(payload) {
    const { requestId, data, requestType } = payload;
    console.log(`收到请求 [${requestId}]:`, requestType);

    try {
      if (requestType === 'chat') {
        await this.handleChatRequest(requestId, data);
      } else if (requestType === 'image') {
        await this.handleImageRequest(requestId, data);
      } else if (requestType === 'video') {
        await this.handleVideoRequest(requestId, data);
      }
    } catch (error) {
      console.error('处理请求失败:', error);
      this.sendResponse(requestId, JSON.stringify({ error: error.message }));
    }
  }

  async handleChatRequest(requestId, data) {
    const { messages, stream, model } = data;

    if (stream) {
      // 模拟流式响应
      const response = this.generateMockResponse(messages);
      const chunks = response.split(' ');

      for (const chunk of chunks) {
        this.sendStreamChunk(requestId, chunk + ' ');
        await this.sleep(100); // 模拟延迟
      }

      this.sendStreamEnd(requestId);
    } else {
      const response = this.generateMockResponse(messages);
      this.sendResponse(requestId, response);
    }
  }

  generateMockResponse(messages) {
    const lastMessage = messages[messages.length - 1];
    return `你发送了: "${lastMessage.content}"。这是一个来自节点的模拟响应。`;
  }

  sendResponse(requestId, content) {
    this.ws.send(JSON.stringify({
      type: 'response',
      payload: { requestId, content }
    }));
  }

  sendStreamChunk(requestId, content) {
    this.ws.send(JSON.stringify({
      type: 'stream',
      payload: { requestId, content }
    }));
  }

  sendStreamEnd(requestId) {
    this.ws.send(JSON.stringify({
      type: 'stream_end',
      payload: { requestId, content: '' }
    }));
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'node-heartbeat',
          payload: {}
        }));
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  scheduleReconnect() {
    console.log(`${this.reconnectDelay / 1000} 秒后重连...`);
    setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async handleImageRequest(requestId, data) {
    // 实现图片生成逻辑
    this.ws.send(JSON.stringify({
      type: 'image_response',
      payload: {
        requestId,
        images: [{ url: 'https://example.com/generated-image.png' }]
      }
    }));
  }

  async handleVideoRequest(requestId, data) {
    // 实现视频生成逻辑
    this.ws.send(JSON.stringify({
      type: 'video_response',
      payload: {
        requestId,
        videos: [{ url: 'https://example.com/generated-video.mp4' }]
      }
    }));
  }
}

// 启动节点
const client = new NodeClient(SERVER_URL, NODE_TOKEN);
client.connect();
```

### 运行示例

```bash
# 保存为 node-client.mjs
node node-client.mjs
```

## 错误处理

### 常见错误

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 1008 | 认证失败 | 检查 Token 是否正确，是否过期 |
| 1006 | 异常断开 | 检查网络连接，实现自动重连 |

### 调试建议

1. 启用详细日志
2. 检查服务器日志中的 `[Node WS]` 输出
3. 使用 Wireshark 或浏览器开发者工具检查 WebSocket 帧

## 在管理员控制台配置节点

1. 进入管理员控制台 -> 节点管理
2. 创建新节点，填写节点 ID 和名称
3. 点击"生成 Token"获取节点 Token
4. 将 Token 用于节点客户端连接

## 相关文档

- [反向 WebSocket 接入文档](./REVERSE_WEBSOCKET.md)
- [管理员设置指南](./ADMIN_SETUP.md)
