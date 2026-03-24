# Reverse WebSocket 接入说明

本文档用于说明如何连接本项目的反向 WebSocket 服务（`/reverse-ws`），并实现一个可处理 AI 请求的客户端。

##1. 功能说明

反向 WebSocket 的目标是：

-由**服务端主动推送请求**给已连接客户端（而不是客户端轮询）
-让外部 AI 执行端（你自己的 worker/代理）实时处理请求
- 在 `chat/completions` 的处理链路中，优先使用反向连接客户端

当前后端实现位置：

- 服务初始化：`src/index.ts:370`
-反向 WS 核心逻辑：`src/reverseWebSocket.ts:12`
- Chat 请求分发入口：`src/routes/v1/chat/completions.ts:349`

---

##2. 服务端地址

默认监听路径：

- `ws://<host>:<port>/reverse-ws`

例如本地默认端口：

- `ws://localhost:7143/reverse-ws`

> 路径由 `initReverseWebSocket(server, '/reverse-ws')` 挂载（见 `src/index.ts:370`）。

---

##3.连接与注册流程

连接建立后，建议按以下顺序：

1. 客户端连接 `/reverse-ws`
2. 服务端先发一条 `connected`
3. 客户端发送 `reverse-connect` 完成注册
4. 服务端回复 `reverse-connect-ack`
5. 服务端开始推送 `request` 消息

###3.1 服务端初始确认

```json
{
 "type": "connected",
 "payload": {
 "message": "已连接到反向 WebSocket 服务"
 }
}
```

###3.2 客户端注册（reverse-connect）

```json
{
 "type": "reverse-connect",
 "payload": {
 "clientId": "worker-01",
 "capabilities": ["chat", "stream"],
 "maxConcurrentRequests":8
 }
}
```

- `clientId` 可选；不传时服务端会自动生成
- `capabilities` 当前用于记录/观测（见 `src/reverseWebSocket.ts:98`）
- `maxConcurrentRequests` 在类型层支持（`src/types.ts:533`），可随注册消息传入

###3.3 注册确认（reverse-connect-ack）

```json
{
 "type": "reverse-connect-ack",
 "payload": {
 "success": true,
 "clientId": "worker-01",
 "message": "反向连接注册成功"
 }
}
```

---

##4. 请求下发消息（服务端 -> 客户端）

服务端会推送 `request`：

```json
{
 "type": "request",
 "payload": {
 "requestId": "req_xxx",
 "data": { "model": "gpt-4o-mini", "messages": [{ "role": "user", "content": "hi" }] },
 "requestParams": {
 "temperature":0.7,
 "top_p":1,
 "max_tokens":512
 },
 "requestType": "chat"
 }
}
```

`payload` 字段定义可参考：`src/types.ts:501`。

常见字段：

- `requestId`: 本次请求唯一 ID，回包必须带回
- `data`: 原始 chat 请求体（`ChatCompletionRequest`）
- `requestParams`: 补充参数
- `requestType`: `chat | image | video`
- `imageRequest` / `videoRequest`: 图像/视频请求附加信息

---

##5. 客户端回包消息（客户端 -> 服务端）

服务端可处理这些类型（`src/reverseWebSocket.ts:67`）：

- `response`：非流式文本结果
- `stream`：流式分片
- `stream_end`：流式结束
- `image_response`：图像结果
- `video_response`：视频结果

###5.1 非流式

```json
{
 "type": "response",
 "payload": {
 "requestId": "req_xxx",
 "content": "这是模型回复"
 }
}
```

###5.2 流式

分片：

```json
{
 "type": "stream",
 "payload": {
 "requestId": "req_xxx",
 "content": "这是第1段"
 }
}
```

结束：

```json
{
 "type": "stream_end",
 "payload": {
 "requestId": "req_xxx",
 "content": ""
 }
}
```

###5.3 图像/视频

```json
{
 "type": "image_response",
 "payload": {
 "requestId": "req_xxx",
 "images": [{ "url": "https://..." }]
 }
}
```

```json
{
 "type": "video_response",
 "payload": {
 "requestId": "req_xxx",
 "videos": [{ "url": "https://..." }]
 }
}
```

---

##6. 最小可运行客户端示例（Node.js）

```js
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:7143/reverse-ws');

ws.on('open', () => {
 console.log('connected');

 ws.send(JSON.stringify({
 type: 'reverse-connect',
 payload: {
 clientId: 'demo-worker',
 capabilities: ['chat', 'stream'],
 maxConcurrentRequests:4,
 },
 }));
});

ws.on('message', async (raw) => {
 const msg = JSON.parse(raw.toString());

 if (msg.type === 'request') {
 const { requestId, data } = msg.payload;
 const userText = data?.messages?.[data.messages.length -1]?.content ?? '';

 // 示例：直接拼接回复。实际场景可在这里调用你自己的模型服务
 const answer = `Echo: ${typeof userText === 'string' ? userText : '[non-text]'}`;

 ws.send(JSON.stringify({
 type: 'response',
 payload: {
 requestId,
 content: answer,
 },
 }));
 }
});

ws.on('close', () => {
 console.log('closed');
});

ws.on('error', (err) => {
 console.error('ws error:', err.message);
});
```

---

##7. 分发策略与回退行为

在 `/v1/chat/completions` 非流式请求里（见 `src/routes/v1/chat/completions.ts:349`）：

1. 若有反向客户端，先 `broadcastRequestToReverseClients(...)`
2. 若发送数为0，再回退到普通 `broadcastRequest(...)`
3. 在“用户/客户端回复”与“模型转发结果”之间做竞速，先返回先用

说明：反向 WS不是唯一通道，而是优先通道。

---

##8. 超时与断线建议

- 服务端请求默认有超时保护（chat 手动模式下10 分钟，见 `src/routes/v1/chat/completions.ts:506`、`:536`）
- 客户端应实现自动重连（指数退避）
- 建议业务侧记录 `requestId`、耗时、错误码，便于排查
- 客户端下线前可主动发送：

```json
{
 "type": "reverse-disconnect",
 "payload": { "message": "bye" }
}
```

---

##9. 常见排查

1. **连不上服务**
 - 检查服务是否启动，端口是否正确
 - 检查是否连接到 `/reverse-ws` 路径

2. **注册后收不到 request**
 - 确认已发送 `reverse-connect`，并收到 `reverse-connect-ack`
 - 确认当前确实有 `/v1/chat/completions` 请求进入

3. **回包无效 / 请求无法结束**
 - 检查 `requestId` 是否与下发请求一致
 - 流式模式需发送 `stream_end`

4. **日志里出现“未找到请求”**
 -说明请求已超时或已被其他路径先处理，属于并发竞速下的正常现象之一

---

##10. 安全建议

-生产环境建议只在内网暴露 `/reverse-ws`，或通过网关做访问控制
- 对连接来源进行鉴权（例如在网关层做 token 校验）
- 客户端避免信任未校验输入，执行外部调用时注意超时与注入风险
