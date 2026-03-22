/**
 * API 端点统一配置
 * 用于启动时展示和文档生成
 */

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
  auth?: 'none' | 'api-key' | 'jwt' | 'admin';
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  // ==================== OpenAI 兼容 API ====================
  { method: 'POST', path: '/v1/chat/completions', description: '聊天补全（支持流式）', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/completions', description: '文本补全（已废弃）', category: 'OpenAI', auth: 'api-key' },
  { method: 'GET', path: '/v1/models', description: '获取模型列表', category: 'OpenAI', auth: 'api-key' },
  { method: 'GET', path: '/v1/models/:id', description: '获取单个模型信息', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/embeddings', description: '向量嵌入', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/moderations', description: '内容审核', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/images/generations', description: '图像生成', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/images/edits', description: '图像编辑', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/videos/generations', description: '视频生成', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/responses', description: 'Responses API', category: 'OpenAI', auth: 'api-key' },
  { method: 'POST', path: '/v1/rerank', description: '文档重排序', category: 'OpenAI', auth: 'api-key' },
  
  // ==================== Anthropic 兼容 API ====================
  { method: 'POST', path: '/v1/messages', description: 'Anthropic Messages API', category: 'Anthropic', auth: 'api-key' },
  
  // ==================== Google Gemini 兼容 API ====================
  { method: 'POST', path: '/v1beta/models/:model:generateContent', description: 'Gemini 生成内容', category: 'Google', auth: 'api-key' },
  { method: 'POST', path: '/v1beta/models/:model:streamGenerateContent', description: 'Gemini 流式生成', category: 'Google', auth: 'api-key' },
  { method: 'POST', path: '/v1beta/models/:model:embedContent', description: 'Gemini 向量嵌入', category: 'Google', auth: 'api-key' },
  { method: 'GET', path: '/v1beta/models', description: 'Gemini 模型列表', category: 'Google', auth: 'api-key' },
  { method: 'GET', path: '/v1beta/models/:modelId', description: 'Gemini 单个模型信息', category: 'Google', auth: 'api-key' },
  
  // ==================== Actions API ====================
  { method: 'GET', path: '/v1/actions/models', description: '获取可访问的 Actions', category: 'Actions', auth: 'api-key' },
  { method: 'POST', path: '/v1/actions/completions', description: '调用 Action', category: 'Actions', auth: 'api-key' },
  
  // ==================== 认证 API ====================
  { method: 'POST', path: '/api/auth/send-verification-code', description: '发送邮箱验证码', category: 'Auth', auth: 'none' },
  { method: 'POST', path: '/api/auth/register', description: '用户注册', category: 'Auth', auth: 'none' },
  { method: 'POST', path: '/api/auth/login', description: '用户登录', category: 'Auth', auth: 'none' },
  { method: 'POST', path: '/api/auth/refresh', description: '刷新 Token', category: 'Auth', auth: 'none' },
  { method: 'GET', path: '/api/auth/me', description: '获取当前用户', category: 'Auth', auth: 'jwt' },
  { method: 'POST', path: '/api/auth/logout', description: '用户登出', category: 'Auth', auth: 'jwt' },
  
  // ==================== 用户 API ====================
  { method: 'GET', path: '/api/user/profile', description: '获取用户资料', category: 'User', auth: 'jwt' },
  { method: 'PUT', path: '/api/user/profile', description: '更新用户资料', category: 'User', auth: 'jwt' },
  { method: 'PUT', path: '/api/user/password', description: '修改密码', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/api-keys', description: '获取用户 API Keys', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/api-keys/:id/reveal', description: '查看完整 API Key', category: 'User', auth: 'jwt' },
  { method: 'POST', path: '/api/user/api-keys', description: '创建 API Key', category: 'User', auth: 'jwt' },
  { method: 'PUT', path: '/api/user/api-keys/:id', description: '更新 API Key', category: 'User', auth: 'jwt' },
  { method: 'DELETE', path: '/api/user/api-keys/:id', description: '删除 API Key', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/usage', description: '获取使用统计', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/billing', description: '获取账单信息', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/usage/records', description: '获取使用记录', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/invitation', description: '获取邀请信息', category: 'User', auth: 'jwt' },
  { method: 'POST', path: '/api/user/invitation/purchase', description: '购买邀请额度', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/notifications', description: '获取用户通知', category: 'User', auth: 'jwt' },
  { method: 'GET', path: '/api/user/uid', description: '获取用户 UID', category: 'User', auth: 'jwt' },
  { method: 'PUT', path: '/api/user/uid', description: '设置用户 UID', category: 'User', auth: 'jwt' },
  { method: 'POST', path: '/api/user/uid/check', description: '检查 UID 是否可用', category: 'User', auth: 'none' },
  
  // ==================== 用户 Actions 管理 ====================
  { method: 'GET', path: '/api/actions', description: '获取用户的 Actions', category: 'User Actions', auth: 'jwt' },
  { method: 'GET', path: '/api/actions/:id', description: '获取单个 Action', category: 'User Actions', auth: 'jwt' },
  { method: 'POST', path: '/api/actions', description: '创建 Action', category: 'User Actions', auth: 'jwt' },
  { method: 'PUT', path: '/api/actions/:id', description: '更新 Action', category: 'User Actions', auth: 'jwt' },
  { method: 'DELETE', path: '/api/actions/:id', description: '删除 Action', category: 'User Actions', auth: 'jwt' },
  { method: 'GET', path: '/api/actions/docs/sandbox', description: '获取沙箱接口文档', category: 'User Actions', auth: 'jwt' },
  { method: 'POST', path: '/api/actions/validate', description: '验证 Action 代码', category: 'User Actions', auth: 'jwt' },
  { method: 'POST', path: '/api/actions/:id/publish', description: '发布 Action 到广场', category: 'User Actions', auth: 'jwt' },
  { method: 'POST', path: '/api/actions/:id/unpublish', description: '取消发布 Action', category: 'User Actions', auth: 'jwt' },
  
  // ==================== Workflows API ====================
  { method: 'GET', path: '/api/workflows', description: '获取工作流列表', category: 'Workflows', auth: 'jwt' },
  { method: 'GET', path: '/api/workflows/:id', description: '获取单个工作流', category: 'Workflows', auth: 'jwt' },
  { method: 'POST', path: '/api/workflows', description: '创建工作流', category: 'Workflows', auth: 'jwt' },
  { method: 'PUT', path: '/api/workflows/:id', description: '更新工作流', category: 'Workflows', auth: 'jwt' },
  { method: 'DELETE', path: '/api/workflows/:id', description: '删除工作流', category: 'Workflows', auth: 'jwt' },
  { method: 'POST', path: '/api/workflows/:id/run', description: '运行工作流', category: 'Workflows', auth: 'jwt' },
  { method: 'GET', path: '/api/workflow-runs', description: '获取工作流运行记录', category: 'Workflows', auth: 'jwt' },
  { method: 'GET', path: '/api/workflow-runs/:id', description: '获取工作流运行详情', category: 'Workflows', auth: 'jwt' },
  { method: 'POST', path: '/api/workflow-runs/:id/cancel', description: '取消工作流运行', category: 'Workflows', auth: 'jwt' },
  
  // ==================== 管理员 API ====================
  { method: 'GET', path: '/api/admin/users', description: '获取用户列表', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/users/:id', description: '获取单个用户', category: 'Admin', auth: 'admin' },
  { method: 'PUT', path: '/api/admin/users/:id', description: '更新用户', category: 'Admin', auth: 'admin' },
  { method: 'DELETE', path: '/api/admin/users/:id', description: '删除用户', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/users/:id/api-keys', description: '获取用户 API Keys', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/users/:id/usage', description: '获取用户使用记录', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/analytics/usage', description: '获取使用分析', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/analytics/system', description: '获取系统分析', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/notifications', description: '获取通知列表', category: 'Admin', auth: 'admin' },
  { method: 'POST', path: '/api/admin/notifications', description: '创建通知', category: 'Admin', auth: 'admin' },
  { method: 'PUT', path: '/api/admin/notifications/:id', description: '更新通知', category: 'Admin', auth: 'admin' },
  { method: 'DELETE', path: '/api/admin/notifications/:id', description: '删除通知', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/models', description: '获取模型列表', category: 'Admin', auth: 'admin' },
  { method: 'GET', path: '/api/admin/models/:id', description: '获取单个模型', category: 'Admin', auth: 'admin' },
  { method: 'POST', path: '/api/admin/models', description: '创建模型', category: 'Admin', auth: 'admin' },
  { method: 'PUT', path: '/api/admin/models/:id', description: '更新模型', category: 'Admin', auth: 'admin' },
  { method: 'DELETE', path: '/api/admin/models/:id', description: '删除模型', category: 'Admin', auth: 'admin' },
  
  // ==================== 管理端 API（兼容路由） ====================
  { method: 'GET', path: '/api/models', description: '获取模型列表', category: 'Admin API', auth: 'admin' },
  { method: 'POST', path: '/api/models', description: '创建模型', category: 'Admin API', auth: 'admin' },
  { method: 'PUT', path: '/api/models/:id', description: '更新模型', category: 'Admin API', auth: 'admin' },
  { method: 'DELETE', path: '/api/models/:id', description: '删除模型', category: 'Admin API', auth: 'admin' },
  { method: 'GET', path: '/api/model-icons', description: '获取模型图标列表', category: 'Admin API', auth: 'admin' },
  { method: 'POST', path: '/api/model-icons/upload', description: '上传模型图标', category: 'Admin API', auth: 'admin' },
  { method: 'DELETE', path: '/api/model-icons/:filename', description: '删除模型图标', category: 'Admin API', auth: 'admin' },
  { method: 'GET', path: '/api/stats', description: '获取系统统计', category: 'Admin API', auth: 'admin' },
  { method: 'GET', path: '/api/settings', description: '获取系统设置', category: 'Admin API', auth: 'admin' },
  { method: 'PUT', path: '/api/settings', description: '更新系统设置', category: 'Admin API', auth: 'admin' },
  { method: 'GET', path: '/api/keys', description: '获取所有 API Keys', category: 'Admin API', auth: 'admin' },
  { method: 'GET', path: '/api/keys/:id/reveal', description: '查看完整 API Key', category: 'Admin API', auth: 'admin' },
  { method: 'POST', path: '/api/keys', description: '创建 API Key', category: 'Admin API', auth: 'admin' },
  { method: 'PUT', path: '/api/keys/:id', description: '更新 API Key', category: 'Admin API', auth: 'admin' },
  { method: 'DELETE', path: '/api/keys/:id', description: '删除 API Key', category: 'Admin API', auth: 'admin' },
  
  // ==================== 公开 API ====================
  { method: 'GET', path: '/api/server-config', description: '获取服务器配置', category: 'Public', auth: 'none' },
  
  // ==================== WebSocket ====================
  { method: 'GET', path: '/ws', description: 'WebSocket 连接（用于实时请求推送）', category: 'WebSocket', auth: 'none' },
];

/**
 * 认证类型说明
 */
export const AUTH_TYPE_DESCRIPTIONS: Record<string, string> = {
  'none': '无需认证',
  'api-key': '需要 API Key（Authorization: Bearer sk-xxx 或 x-api-key 或 x-goog-api-key）',
  'jwt': '需要 JWT Token（登录后获取）',
  'admin': '需要管理员权限的 JWT Token',
};

/**
 * 格式化端点列表用于控制台输出
 */
export function formatEndpointsForConsole(): string {
  const categories = [...new Set(API_ENDPOINTS.map(e => e.category))];
  const lines: string[] = [];
  
  for (const category of categories) {
    lines.push(`  ${category}:`);
    const endpoints = API_ENDPOINTS.filter(e => e.category === category);
    for (const endpoint of endpoints) {
      const method = endpoint.method.padEnd(6);
      const auth = endpoint.auth ? ` [${endpoint.auth}]` : '';
      lines.push(`    ${method} ${endpoint.path}${auth} - ${endpoint.description}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * 获取按类别分组的端点
 */
export function getEndpointsByCategory(): Record<string, ApiEndpoint[]> {
  const result: Record<string, ApiEndpoint[]> = {};
  for (const endpoint of API_ENDPOINTS) {
    if (!result[endpoint.category]) {
      result[endpoint.category] = [];
    }
    result[endpoint.category].push(endpoint);
  }
  return result;
}

/**
 * 生成 Markdown 格式的 API 文档
 */
export function generateApiDocsMarkdown(): string {
  const lines: string[] = [];
  lines.push('## API 端点');
  lines.push('');
  lines.push('### 认证方式');
  lines.push('');
  for (const [type, desc] of Object.entries(AUTH_TYPE_DESCRIPTIONS)) {
    lines.push(`- **${type}**: ${desc}`);
  }
  lines.push('');
  
  const categories = [...new Set(API_ENDPOINTS.map(e => e.category))];
  for (const category of categories) {
    lines.push(`### ${category}`);
    lines.push('');
    lines.push('| 方法 | 路径 | 认证 | 描述 |');
    lines.push('|------|------|------|------|');
    const endpoints = API_ENDPOINTS.filter(e => e.category === category);
    for (const endpoint of endpoints) {
      const auth = endpoint.auth || '-';
      lines.push(`| ${endpoint.method} | \`${endpoint.path}\` | ${auth} | ${endpoint.description} |`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}