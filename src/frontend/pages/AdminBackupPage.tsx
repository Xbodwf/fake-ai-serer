import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Snackbar,
} from '@mui/material';
import {
  Download,
  Upload,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: number;
  createdBy: string;
  description?: string;
}

export default function AdminBackupPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [restartCountdown, setRestartCountdown] = useState(5);
  const [description, setDescription] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载备份列表
  const loadBackups = async () => {
    try {
      const response = await fetch('/api/admin/backup/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.backups) {
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
      setSnackbar({
        open: true,
        message: t('backup.loadError', '加载备份列表失败'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // 创建备份
  const handleCreateBackup = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/backup/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();
      if (data.success) {
        setSnackbar({
          open: true,
          message: t('backup.createSuccess', '备份创建成功'),
          severity: 'success',
        });
        await loadBackups();
        setShowCreateDialog(false);
        setDescription('');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      setSnackbar({
        open: true,
        message: t('backup.createError', '创建备份失败') + ': ' + error.message,
        severity: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  // 下载备份
  const handleDownloadBackup = (backup: Backup) => {
    // 使用浏览器原生下载方式
    const token = localStorage.getItem('token');
    const url = `/api/admin/backup/download/${backup.id}?token=${token}`;
    
    // 创建一个隐藏的a标签触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 删除备份
  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm(t('backup.deleteConfirm', '确定要删除此备份吗？'))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/backup/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSnackbar({
          open: true,
          message: t('backup.deleteSuccess', '备份删除成功'),
          severity: 'success',
        });
        await loadBackups();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Failed to delete backup:', error);
      setSnackbar({
        open: true,
        message: t('backup.deleteError', '删除备份失败') + ': ' + error.message,
        severity: 'error',
      });
    }
  };

  // 上传并导入备份
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pm.zip')) {
      setSnackbar({
        open: true,
        message: t('backup.invalidFile', '请上传 .pm.zip 格式的备份文件'),
        severity: 'error',
      });
      return;
    }

    if (!window.confirm(t('backup.importConfirm', '导入备份将覆盖当前所有数据，且服务器将自动重启。确定要继续吗？'))) {
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('backup', file);

    try {
      const response = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setShowRestartDialog(true);
        setRestartCountdown(5);
        
        // 倒计时
        const timer = setInterval(() => {
          setRestartCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Failed to import backup:', error);
      setSnackbar({
        open: true,
        message: t('backup.importError', '导入备份失败') + ': ' + error.message,
        severity: 'error',
      });
      setImporting(false);
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('backup.title', '数据备份管理')}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t('backup.info', '备份文件包含服务器所有数据，可用于迁移或恢复。导入备份将覆盖当前数据并自动重启服务器。')}
      </Alert>

      {/* 操作按钮 */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <Plus />}
          onClick={() => setShowCreateDialog(true)}
          disabled={exporting}
        >
          {exporting ? t('backup.creating', '创建中...') : t('backup.create', '创建备份')}
        </Button>

        <Button
          variant="outlined"
          startIcon={<Upload />}
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? t('backup.importing', '导入中...') : t('backup.import', '导入备份')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pm.zip"
          style={{ display: 'none' }}
          onChange={handleImportBackup}
        />

        <Button
          variant="outlined"
          startIcon={<RefreshCw />}
          onClick={loadBackups}
        >
          {t('common.refresh', '刷新')}
        </Button>
      </Stack>

      {/* 备份列表 */}
      {backups.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              {t('backup.noBackups', '暂无备份')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {backups.map((backup) => (
            <Card key={backup.id}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {backup.filename}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('backup.size', '大小')}: {formatSize(backup.size)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('backup.createdAt', '创建时间')}: {formatDate(backup.createdAt)}
                      </Typography>
                    </Stack>
                    {backup.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {backup.description}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => handleDownloadBackup(backup)}
                      title={t('backup.download', '下载')}
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteBackup(backup.id)}
                      title={t('common.delete', '删除')}
                    >
                      <Trash2 />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* 创建备份对话框 */}
      <Dialog open={showCreateDialog} onClose={() => !exporting && setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('backup.createBackup', '创建备份')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('backup.description', '描述（可选）')}
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={exporting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)} disabled={exporting}>
            {t('common.cancel', '取消')}
          </Button>
          <Button
            onClick={handleCreateBackup}
            variant="contained"
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {exporting ? t('backup.creating', '创建中...') : t('backup.create', '创建')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重启提示对话框 */}
      <Dialog open={showRestartDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          {t('backup.importSuccess', '导入成功')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography>
              {t('backup.restartMessage', '服务器将在 {{countdown}} 秒后自动重启...', { countdown: restartCountdown })}
            </Typography>
          </Alert>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            {t('backup.restartNote', '请保存您的工作并等待服务器重启。重启完成后需要重新登录。')}
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Snackbar 提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
