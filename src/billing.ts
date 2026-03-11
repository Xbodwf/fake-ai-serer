import type { Model, UsageRecord } from './types.js';

/**
 * 计算 token 数量（简单估算）
 * 实际应用中可以使用 js-tiktoken 库进行精确计数
 */
export function estimateTokens(text: string): number {
  // 简单估算：平均每 4 个字符 = 1 token
  return Math.ceil(text.length / 4);
}

/**
 * 计算费用
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: Model
): number {
  if (!model.pricing) {
    return 0;
  }

  const inputCost = (promptTokens * (model.pricing.input || 0)) / 1000;
  const outputCost = (completionTokens * (model.pricing.output || 0)) / 1000;

  return inputCost + outputCost;
}

/**
 * 创建使用记录
 */
export function createUsageRecord(
  userId: string,
  apiKeyId: string,
  model: string,
  endpoint: string,
  promptTokens: number,
  completionTokens: number,
  cost: number,
  requestId: string
): UsageRecord {
  return {
    id: generateId(),
    userId,
    apiKeyId,
    model,
    endpoint,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cost,
    timestamp: Date.now(),
    requestId,
  };
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
