// OpenAI API Types

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: 'stop' | 'length' | 'tool_calls' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: 'stop' | 'length' | null;
  }>;
}

export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  description?: string;
  context_length?: number;
}

export interface ModelsResponse {
  object: 'list';
  data: Model[];
}

// WebSocket 消息类型
export interface WSMessage {
  type: 'request' | 'response' | 'stream' | 'stream_end' | 'connected' | 'models_update';
  payload: {
    requestId: string;
    data: ChatCompletionRequest;
  } | {
    requestId: string;
    content: string;
  } | {
    message: string;
  } | {
    models: Model[];
  };
}

// 待处理的请求
export interface PendingRequest {
  requestId: string;
  request: ChatCompletionRequest;
  resolve: (content: string) => void;
  streamController?: {
    enqueue: (chunk: string) => void;
    close: () => void;
  };
  isStream: boolean;
  createdAt: number;
}
