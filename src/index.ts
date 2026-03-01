import express, { Request, Response } from 'express';
import type { ChatCompletionRequest, PendingRequest, Model } from './types.js';
import { addPendingRequest, getPendingRequest, removePendingRequest, getPendingCount } from './requestStore.js';
import { buildResponse, buildStreamChunk, buildStreamDone, generateRequestId } from './responseBuilder.js';
import { broadcastRequest, initWebSocket, getConnectedClientsCount, broadcastModelsUpdate } from './websocket.js';
import { createServer } from 'http';
import {
  loadModels,
  getAllModels,
  getModel,
  addModel as storageAddModel,
  updateModel as storageUpdateModel,
  deleteModel as storageDeleteModel,
  getServerConfig,
  getSettings,
  updateSettings,
} from './storage.js';

const app = express();
const server = createServer(app);

// 中间件
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==================== 管理 API ====================

// GET /api/models - 获取模型列表（管理用）
app.get('/api/models', (req: Request, res: Response) => {
  res.json({ models: getAllModels() });
});

// POST /api/models - 添加模型
app.post('/api/models', async (req: Request, res: Response) => {
  const { id, owned_by, description, context_length } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Model ID is required' });
  }

  if (getModel(id)) {
    return res.status(400).json({ error: 'Model already exists' });
  }

  try {
    const newModel = await storageAddModel({
      id,
      owned_by: owned_by || 'custom',
      description: description || '',
      context_length: context_length || 4096,
    });
    broadcastModelsUpdate(getAllModels());
    res.json({ success: true, model: newModel });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add model' });
  }
});

// PUT /api/models/:id - 更新模型
app.put('/api/models/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { owned_by, description, context_length } = req.body;

  try {
    const updated = await storageUpdateModel(id, {
      owned_by,
      description,
      context_length,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Model not found' });
    }

    broadcastModelsUpdate(getAllModels());
    res.json({ success: true, model: updated });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update model' });
  }
});

// DELETE /api/models/:id - 删除模型
app.delete('/api/models/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleted = await storageDeleteModel(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Model not found' });
    }
    broadcastModelsUpdate(getAllModels());
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// GET /api/stats - 获取统计信息
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    pendingRequests: getPendingCount(),
    connectedClients: getConnectedClientsCount(),
    totalModels: getAllModels().length,
  });
});

// GET /api/settings - 获取系统设置
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings - 更新系统设置
app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const settings = await updateSettings(req.body);
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==================== OpenAI API 路由 ====================

// GET /v1/models - 获取模型列表
app.get('/v1/models', (req: Request, res: Response) => {
  res.json({
    object: 'list',
    data: getAllModels(),
  });
});

// GET /v1/models/:id - 获取单个模型
app.get('/v1/models/:id', (req: Request, res: Response) => {
  const model = getModel(req.params.id);
  if (!model) {
    return res.status(404).json({
      error: { message: 'Model not found', type: 'invalid_request_error' }
    });
  }
  res.json(model);
});

// POST /v1/chat/completions - 聊天补全
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  const body = req.body as ChatCompletionRequest;

  if (!body.model || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({
      error: {
        message: 'Invalid request: model and messages are required',
        type: 'invalid_request_error',
      }
    });
  }

  // 验证模型是否存在
  const modelExists = getModel(body.model);
  if (!modelExists) {
    console.log('[Server] 模型不存在:', body.model);
    return res.status(400).json({
      error: {
        message: `Model '${body.model}' not found. Available models: ${getAllModels().map(m => m.id).join(', ')}`,
        type: 'invalid_request_error',
        code: 'model_not_found',
      }
    });
  }

  const requestId = generateRequestId();
  const isStream = body.stream === true;

  console.log('\n========================================');
  console.log('收到新的 ChatCompletion 请求');
  console.log('请求ID:', requestId);
  console.log('模型:', body.model);
  console.log('流式:', isStream);
  console.log('消息数:', body.messages.length);
  console.log('当前前端连接数:', getConnectedClientsCount());
  console.log('----------------------------------------');

  body.messages.forEach((msg, i) => {
    console.log(`  [${i + 1}] ${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
  });
  console.log('========================================\n');

  if (isStream) {
    // 流式响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let streamEnded = false;
    const chunks: string[] = [];

    const pending: PendingRequest = {
      requestId,
      request: body,
      isStream: true,
      createdAt: Date.now(),
      resolve: () => {},
      streamController: {
        enqueue: (content: string) => {
          if (!streamEnded) {
            chunks.push(content);
            const isFirst = chunks.length === 1;
            res.write(buildStreamChunk(requestId, body.model, content, isFirst));
          }
        },
        close: () => {
          if (!streamEnded) {
            streamEnded = true;
            res.write(buildStreamChunk(requestId, body.model, '', false, true));
            res.write(buildStreamDone());
            res.end();
          }
        }
      }
    };

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      if (!streamEnded) {
        streamEnded = true;
        removePendingRequest(requestId);
        res.write(buildStreamDone());
        res.end();
        console.log('[Server] 流式请求超时:', requestId);
      }
    }, 10 * 60 * 1000);

    req.on('close', () => {
      clearTimeout(timeout);
      removePendingRequest(requestId);
    });

  } else {
    // 非流式响应
    const pending: PendingRequest = {
      requestId,
      request: body,
      isStream: false,
      createdAt: Date.now(),
      resolve: () => {},
    };

    const responsePromise = new Promise<string>((resolve) => {
      pending.resolve = resolve;
    });

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      removePendingRequest(requestId);
      res.json(buildResponse('请求超时，请重试', body.model, requestId));
    }, 10 * 60 * 1000);

    try {
      const content = await responsePromise;
      clearTimeout(timeout);
      res.json(buildResponse(content, body.model, requestId));
    } catch (e) {
      clearTimeout(timeout);
      res.status(500).json({
        error: {
          message: 'Internal server error',
          type: 'server_error',
        }
      });
    }
  }
});

// POST /v1/completions - 文本补全（旧版）
app.post('/v1/completions', (req: Request, res: Response) => {
  res.status(400).json({
    error: {
      message: 'This endpoint is deprecated. Please use /v1/chat/completions',
      type: 'invalid_request_error',
    }
  });
});

// POST /v1/embeddings - 向量嵌入
app.post('/v1/embeddings', (req: Request, res: Response) => {
  res.json({
    object: 'list',
    data: [{
      object: 'embedding',
      embedding: new Array(1536).fill(0),
      index: 0,
    }],
    model: req.body.model || 'text-embedding-ada-002',
    usage: {
      prompt_tokens: 0,
      total_tokens: 0,
    }
  });
});

// POST /v1/moderations - 内容审核
app.post('/v1/moderations', (req: Request, res: Response) => {
  res.json({
    id: `modr-${generateRequestId()}`,
    model: 'text-moderation-latest',
    results: [{
      flagged: false,
      categories: {},
      category_scores: {},
    }]
  });
});

// 静态文件服务（前端构建产物）
app.use(express.static('frontend/dist'));

// SPA fallback - 使用中间件处理所有未匹配的路由
app.use((req: Request, res: Response) => {
  // 如果是 API 请求但未匹配到路由，返回 404
  if (req.path.startsWith('/api/') || req.path.startsWith('/v1/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // 否则返回前端页面
  res.sendFile('frontend/dist/index.html', { root: '.' });
});

// 启动服务
async function start() {
  // 加载配置和模型
  await loadModels();
  const serverConfig = await getServerConfig();
  const PORT = process.env.PORT || serverConfig.port;

  server.listen(PORT, () => {
    initWebSocket(server);
    console.log('========================================');
    console.log('Fake OpenAI Server 已启动');
    console.log('端口:', PORT);
    console.log('前端地址:', `http://localhost:${PORT}`);
    console.log('API 地址:', `http://localhost:${PORT}/v1`);
    console.log('模型数量:', getAllModels().length);
    console.log('========================================');
  });
}

start().catch(console.error);

export { app, server };
