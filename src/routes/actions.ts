import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware.js';
import {
  getAllActions,
  getActionById,
  getActionsByCreator,
  getPublicActions,
  createAction,
  updateAction,
  deleteAction,
  incrementActionUsage,
} from '../storage.js';

const router: Router = Router();

/**
 * 获取所有 Actions（包括公开的和用户自己的）
 */
router.get('/actions', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const publicActions = getPublicActions();
    const userActions = getActionsByCreator(req.userId!);
    const allActions = [...publicActions, ...userActions];

    // 去重
    const uniqueActions = Array.from(
      new Map(allActions.map(a => [a.id, a])).values()
    );

    res.json(uniqueActions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get actions' });
  }
});

/**
 * 获取单个 Action
 */
router.get('/actions/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const action = getActionById(id);
    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // 检查权限
    if (!action.isPublic && action.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get action' });
  }
});

/**
 * 创建 Action
 */
router.post('/actions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, code, isPublic } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const action = await createAction({
      name,
      description,
      code,
      createdBy: req.userId!,
      isPublic: isPublic || false,
    });

    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create action' });
  }
});

/**
 * 更新 Action
 */
router.put('/actions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const action = getActionById(id);
    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // 检查权限
    if (action.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, description, code, isPublic } = req.body;
    const updated = await updateAction(id, {
      name,
      description,
      code,
      isPublic,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

/**
 * 删除 Action
 */
router.delete('/actions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const action = getActionById(id);
    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // 检查权限
    if (action.createdBy !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await deleteAction(id);
    res.json({ message: 'Action deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete action' });
  }
});

export default router;
