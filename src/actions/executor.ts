import type { Action } from '../types.js';
import { getActionById } from '../storage.js';

// Action 执行上下文
export interface ActionContext {
  userId: string;
  apiKeyId: string;
  variables: Record<string, any>;
  previousOutput?: any;
}

// Action 执行结果
export interface ActionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
}

// 内置函数
const builtins = {
  // 调用模型
  async callModel(modelId: string, params: any) {
    // 这将在后续实现中集成到 API 调用
    console.log(`[Action] Calling model: ${modelId}`, params);
    return { role: 'assistant', content: 'Mock response' };
  },

  // 调用 Terminal（带 Sandbox）
  async callTerminal(command: string) {
    // 这将在 Sandbox 中执行
    console.log(`[Action] Executing command: ${command}`);
    return { stdout: '', stderr: '' };
  },

  // 延迟
  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 日志
  log(...args: any[]) {
    console.log('[Action]', ...args);
  },
};

/**
 * 执行 Action
 */
export async function executeAction(
  action: Action,
  context: ActionContext,
  input?: any
): Promise<ActionResult> {
  const startTime = Date.now();

  try {
    // 创建执行函数
    const executeFunc = new Function(
      'callModel',
      'callTerminal',
      'delay',
      'log',
      'input',
      'context',
      `
      return (async () => {
        ${action.code}
      })()
      `
    );

    // 执行 Action
    const output = await executeFunc(
      builtins.callModel,
      builtins.callTerminal,
      builtins.delay,
      builtins.log,
      input,
      context
    );

    return {
      success: true,
      output,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * 执行 Action 链
 */
export async function executeActionChain(
  actionIds: string[],
  context: ActionContext,
  initialInput?: any
): Promise<ActionResult> {
  const startTime = Date.now();
  let currentOutput = initialInput;

  try {
    for (const actionId of actionIds) {
      const action = getActionById(actionId);
      if (!action) {
        throw new Error(`Action not found: ${actionId}`);
      }

      const result = await executeAction(action, context, currentOutput);
      if (!result.success) {
        throw new Error(`Action failed: ${action.name} - ${result.error}`);
      }

      currentOutput = result.output;
    }

    return {
      success: true,
      output: currentOutput,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * 验证 Action 代码
 */
export function validateActionCode(code: string): { valid: boolean; error?: string } {
  try {
    // 检查是否包含危险操作
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+/,
      /eval\s*\(/,
      /Function\s*\(/,
      /process\./,
      /fs\./,
      /child_process/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          valid: false,
          error: `Dangerous operation detected: ${pattern.source}`,
        };
      }
    }

    // 尝试编译代码
    new Function(
      'callModel',
      'callTerminal',
      'delay',
      'log',
      'input',
      'context',
      `return (async () => { ${code} })()`
    );

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
