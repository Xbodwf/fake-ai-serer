import { Router, Response, NextFunction } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllApiKeys,
  getUserUsageRecords,
  getAllActions,
  getAllModels,
} from '../storage.js';

const router: Router = Router();

/**
 * 获取所有用户
 */
router.get('/users', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const users = getAllUsers();
    res.json(
      users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        balance: u.balance,
        totalUsage: u.totalUsage,
        role: u.role,
        enabled: u.enabled,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * 获取用户详情
 */
router.get('/users/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const apiKeys = getAllApiKeys().filter(k => k.userId === user.id);
    const usageRecords = getUserUsageRecords(user.id);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      totalUsage: user.totalUsage,
      role: user.role,
      enabled: user.enabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      apiKeys: apiKeys.length,
      totalRequests: usageRecords.length,
      totalCost: usageRecords.reduce((sum, r) => sum + r.cost, 0),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

/**
 * 更新用户（充值/扣费/启用/禁用）
 */
router.put('/users/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { balance, enabled, role } = req.body;

    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates: any = {};
    if (balance !== undefined) {
      updates.balance = balance;
    }
    if (enabled !== undefined) {
      updates.enabled = enabled;
    }
    if (role !== undefined && (role === 'user' || role === 'admin')) {
      updates.role = role;
    }

    const updated = await updateUser(userId, updates);
    res.json({
      id: updated!.id,
      username: updated!.username,
      email: updated!.email,
      balance: updated!.balance,
      role: updated!.role,
      enabled: updated!.enabled,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * 删除用户
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await deleteUser(id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * 获取全局使用统计
 */
router.get('/analytics/usage', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const users = getAllUsers();
    let totalUsers = users.length;
    let totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
    let totalUsage = users.reduce((sum, u) => sum + u.totalUsage, 0);
    let totalCost = 0;

    users.forEach(user => {
      const records = getUserUsageRecords(user.id);
      totalCost += records.reduce((sum, r) => sum + r.cost, 0);
    });

    res.json({
      totalUsers,
      totalBalance,
      totalUsage,
      totalCost,
      averageBalance: totalUsers > 0 ? totalBalance / totalUsers : 0,
      averageUsage: totalUsers > 0 ? totalUsage / totalUsers : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * 获取系统统计
 */
router.get('/analytics/system', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const users = getAllUsers();
    const apiKeys = getAllApiKeys();
    const actions = getAllActions();
    const models = getAllModels();

    res.json({
      totalUsers: users.length,
      totalApiKeys: apiKeys.length,
      totalActions: actions.length,
      totalModels: models.length,
      activeUsers: users.filter(u => u.enabled).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system analytics' });
  }
});

/**
 * 获取用户的 API Keys
 */
router.get('/users/:id/api-keys', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const apiKeys = getAllApiKeys().filter(k => k.userId === id);
    res.json(apiKeys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user API keys' });
  }
});

/**
 * 获取用户的使用记录
 */
router.get('/users/:id/usage', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const records = getUserUsageRecords(id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user usage' });
  }
});

export default router;
