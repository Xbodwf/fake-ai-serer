import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from './auth.js';
import { validateApiKey } from './storage.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  apiKey?: any;
}

/**
 * JWT 认证中间件
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = payload.userId;
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * 管理员权限中间件
 */
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * API Key 认证中间件
 */
export async function apiKeyAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing API key' });
    }

    const key = await validateApiKey(apiKey);
    if (!key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.apiKey = key;
    req.userId = key.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'API key validation failed' });
  }
}

/**
 * 可选的 JWT 认证中间件（不强制）
 */
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.userId = payload.userId;
        req.user = payload;
      }
    }
  } catch (error) {
    // 忽略错误，继续处理
  }
  next();
}

/**
 * 速率限制中间件
 */
export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, number[]>();

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const key = req.userId || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const timestamps = requests.get(key)!;
    const recentRequests = timestamps.filter(t => t > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);
    next();
  };
}

/**
 * 错误处理中间件
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(500).json({ error: 'Internal server error' });
}
