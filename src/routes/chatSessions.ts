import { Router, Response, Request } from 'express';
import { 
  getChatSessionById, 
  getPublicChatSession, 
  updateChatSession,
  deleteChatSession,
  getUserChatSessions,
  createChatSession
} from '../db/chatSessions.js';

const router: Router = Router();

/**
 * POST /api/sessions/new - 创建新会话（需要认证，服务器生成ID）
 */
router.post('/new', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          type: 'authentication_error',
        }
      });
    }

    // 服务器生成唯一ID
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

    const newSession = {
      id: sessionId,
      title: req.body.title || '新对话',
      model: req.body.model || '',
      systemPrompt: req.body.systemPrompt || 'You are a helpful AI assistant.',
      apiType: req.body.apiType || 'openai-chat',
      stream: req.body.stream !== undefined ? req.body.stream : true,
      timeout: req.body.timeout || 60,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: false,
      ownerId: userId,
    };

    const createdSession = await createChatSession(newSession);

    if (createdSession) {
      return res.json({
        ...createdSession,
        isReadOnly: false,
      });
    } else {
      return res.status(500).json({
        error: {
          message: 'Failed to create session',
          type: 'internal_error',
        }
      });
    }
  } catch (error) {
    console.error('Error creating chat session:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      }
    });
  }
});

/**
 * POST /api/chat-sessions - 创建新会话（需要认证，已弃用，请使用 POST /api/sessions/new）
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const sessionData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          type: 'authentication_error',
        }
      });
    }

    // 设置会话所有者
    const newSession = {
      ...sessionData,
      ownerId: userId,
    };

    const createdSession = await createChatSession(newSession);

    if (createdSession) {
      return res.json({
        ...createdSession,
        isReadOnly: false,
      });
    } else {
      return res.status(500).json({
        error: {
          message: 'Failed to create session',
          type: 'internal_error',
        }
      });
    }
  } catch (error) {
    console.error('Error creating chat session:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      }
    });
  }
});

/**
 * GET /api/chat-sessions/:id - 获取会话（公开会话无需认证）
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Fetching session:', id, 'userId:', req.userId);

    // 先尝试获取公开会话
    const session = await getPublicChatSession(id);
    console.log('Public session found:', !!session);

    if (!session) {
      // 如果不是公开会话，尝试获取私有会话（需要认证）
      const userId = req.userId;
      if (!userId) {
        console.log('No userId, returning 404');
        return res.status(404).json({
          error: {
            message: 'Chat session not found or not public',
            type: 'not_found_error',
          }
        });
      }
      
      const privateSession = await getChatSessionById(id);
      if (!privateSession) {
        console.log('Private session not found');
        return res.status(404).json({
          error: {
            message: 'Chat session not found',
            type: 'not_found_error',
          }
        });
      }

      // 检查是否是所有者
      if (privateSession.ownerId !== userId) {
        console.log('Not owner');
        return res.status(403).json({
          error: {
            message: 'You do not have permission to access this session',
            type: 'permission_error',
          }
        });
      }

      // 所有者访问私有会话，返回完整数据
      console.log('Returning private session');
      return res.json({
        ...privateSession,
        isReadOnly: false,
      });
    }

    // 公开会话，检查访问权限
    const userId = req.userId; // 从中间件获取（如果已认证）
    const isOwner = userId && session.ownerId === userId;

    if (isOwner) {
      // 所有者访问，返回完整数据
      return res.json({
        ...session,
        isReadOnly: false,
      });
    } else {
      // 非所有者访问公开会话，返回只读数据
      return res.json({
        id: session.id,
        title: session.title,
        model: session.model,
        systemPrompt: session.systemPrompt,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isPublic: session.isPublic,
        ownerId: session.ownerId,
        isReadOnly: true, // 只读模式
      });
    }
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      }
    });
  }
});

/**
 * GET /api/chat-sessions - 获取用户的会话列表（需要认证）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          type: 'authentication_error',
        }
      });
    }

    const sessions = await getUserChatSessions(userId);
    return res.json(sessions);
  } catch (error) {
    console.error('Error fetching user chat sessions:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      }
    });
  }
});

/**
 * PUT /api/chat-sessions/:id - 更新会话（需要认证）
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          type: 'authentication_error',
        }
      });
    }

    // 检查会话是否存在
    const session = await getChatSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Chat session not found',
          type: 'not_found_error',
        }
      });
    }

    // 检查是否是所有者
    if (session.ownerId !== userId) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to modify this session',
          type: 'permission_error',
        }
      });
    }

    // 更新会话
    console.log('Updating session:', id, 'updates:', updates);
    const success = await updateChatSession(id, updates);
    console.log('Update success:', success);
    
    if (success) {
      const updatedSession = await getChatSessionById(id);
      console.log('Updated session:', { id: updatedSession?.id, isPublic: updatedSession?.isPublic });
      return res.json(updatedSession);
    } else {
      return res.status(500).json({
        error: {
          message: 'Failed to update session',
          type: 'internal_error',
        }
      });
    }
  } catch (error) {
    console.error('Error updating chat session:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      }
    });
  }
});

/**
 * DELETE /api/chat-sessions/:id - 删除会话（需要认证）
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          type: 'authentication_error',
        }
      });
    }

    // 检查会话是否存在
    const session = await getChatSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        error: {
          message: 'Chat session not found',
          type: 'not_found_error',
        }
      });
    }

    // 检查是否是所有者
    if (session.ownerId !== userId) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to delete this session',
          type: 'permission_error',
        }
      });
    }

    const success = await deleteChatSession(id);
    
    if (success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({
        error: {
          message: 'Failed to delete session',
          type: 'internal_error',
        }
      });
    }
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
      }
    });
  }
});

export default router;