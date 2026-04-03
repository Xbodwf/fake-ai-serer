import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  IconButton,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import { Edit2, Trash2, Plus, Key, Search, RefreshCw, Copy, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { copyToClipboard } from '../utils/clipboard';
import axios from 'axios';
import type { Node } from '../types';

interface NodeStatus {
  id: string;
  enabled: boolean;
  status: 'offline' | 'online';
  lastSeenAt?: number;
  tokenVersion: number;
  connected: boolean;
}

interface NodeToken {
  nodeId: string;
  tokenVersion: number;
  token: string;
}

export function AdminNodesPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 搜索
  const [searchText, setSearchText] = useState('');

  // Node 对话框
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [nodeForm, setNodeForm] = useState({
    id: '',
    name: '',
    description: '',
    enabled: true,
    capabilities: '',
    tags: '',
  });

  // Token 对话框
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tokenData, setTokenData] = useState<NodeToken | null>(null);
  const [rotatingToken, setRotatingToken] = useState(false);

  // 状态映射
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});

  useEffect(() => {
    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchNodes();
  }, [user, token, navigate]);

  const fetchNodes = async () => {
    try {
      const response = await axios.get('/api/admin/nodes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nodeList = response.data.nodes || [];
      setNodes(nodeList);
      
      // 获取每个 node 的状态
      for (const node of nodeList) {
        fetchNodeStatus(node.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const fetchNodeStatus = async (nodeId: string) => {
    try {
      const response = await axios.get(`/api/admin/nodes/${nodeId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNodeStatuses(prev => ({ ...prev, [nodeId]: response.data }));
    } catch {
      // ignore
    }
  };

  // Node 操作
  const handleCreateNode = () => {
    setEditingNode(null);
    setNodeForm({
      id: '',
      name: '',
      description: '',
      enabled: true,
      capabilities: '',
      tags: '',
    });
    setShowNodeDialog(true);
  };

  const handleEditNode = (node: Node) => {
    setEditingNode(node);
    setNodeForm({
      id: node.id,
      name: node.name,
      description: node.description || '',
      enabled: node.enabled,
      capabilities: (node.capabilities || []).join(', '),
      tags: (node.tags || []).join(', '),
    });
    setShowNodeDialog(true);
  };

  const handleSaveNode = async () => {
    if (!nodeForm.id || !nodeForm.name) {
      setError(t('nodes.validation.requiredFields'));
      return;
    }

    try {
      const payload = {
        id: nodeForm.id,
        name: nodeForm.name,
        description: nodeForm.description || undefined,
        enabled: nodeForm.enabled,
        capabilities: nodeForm.capabilities ? nodeForm.capabilities.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        tags: nodeForm.tags ? nodeForm.tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      };

      if (editingNode) {
        await axios.put(
          `/api/admin/nodes/${editingNode.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess(t('nodes.updateSuccess'));
      } else {
        const response = await axios.post(
          '/api/admin/nodes',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // 显示新创建节点的 key
        const newNode = response.data;
        if (newNode.key) {
          setSuccess(`${t('nodes.createSuccess')} Key: ${newNode.key}`);
        } else {
          setSuccess(t('nodes.createSuccess'));
        }
      }
      setShowNodeDialog(false);
      await fetchNodes();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToCreate'));
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm(t('nodes.confirmDelete'))) return;

    try {
      await axios.delete(`/api/admin/nodes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t('nodes.deleteSuccess'));
      await fetchNodes();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToDelete'));
    }
  };

  // Token 操作
  const handleIssueToken = async (nodeId: string, rotate: boolean = false) => {
    setRotatingToken(true);
    try {
      const response = await axios.post(
        `/api/admin/nodes/${nodeId}/token`,
        { rotate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTokenData(response.data);
      setShowTokenDialog(true);
      await fetchNodes();
    } catch (err: any) {
      setError(err.response?.data?.error || t('nodes.token.failed'));
    } finally {
      setRotatingToken(false);
    }
  };

  const copyToken = () => {
    if (tokenData?.token) {
      copyToClipboard(tokenData.token)
        .then(() => setSuccess(t('common.copied')))
        .catch(() => {});
    }
  };

  // 过滤
  const filteredNodes = nodes.filter(n =>
    n.name.toLowerCase().includes(searchText.toLowerCase()) ||
    n.id.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('nodes.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('nodes.description')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => navigate('/console/dashboard')}>
            {t('admin.backToDashboard')}
          </Button>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleCreateNode}>
            {t('nodes.createButton')}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder={t('common.search')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <Search size={18} style={{ marginRight: 8 }} />,
              }}
              size="small"
            />
          </Box>

          {filteredNodes.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('nodes.noNodes')}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('common.name')}</TableCell>
                    <TableCell>{t('nodes.nodeId')}</TableCell>
                    <TableCell>{t('nodes.nodeKey')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell>{t('nodes.connectionStatus')}</TableCell>
                    <TableCell>{t('nodes.capabilities')}</TableCell>
                    <TableCell>{t('nodes.lastSeen')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNodes.map((node) => {
                    const status = nodeStatuses[node.id];
                    const isConnected = status?.connected || false;
                    
                    return (
                      <TableRow key={node.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{node.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{node.id}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {node.key ? `${node.key.substring(0, 12)}...` : '-'}
                            </Typography>
                            {node.key && (
                              <IconButton size="small" onClick={() => {
                                copyToClipboard(node.key!)
                                  .then(() => setSuccess(t('common.copied')))
                                  .catch(() => {});
                              }}>
                                <Copy size={14} />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={node.enabled ? t('common.active') : t('common.disabled')}
                            size="small"
                            color={node.enabled ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {isConnected ? (
                              <>
                                <Wifi size={16} color="#4caf50" />
                                <Typography variant="body2" sx={{ color: 'success.main' }}>
                                  {t('nodes.connected')}
                                </Typography>
                              </>
                            ) : (
                              <>
                                <WifiOff size={16} color="#f44336" />
                                <Typography variant="body2" sx={{ color: 'error.main' }}>
                                  {t('nodes.disconnected')}
                                </Typography>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {(node.capabilities || []).slice(0, 3).map((cap) => (
                              <Chip key={cap} label={cap} size="small" variant="outlined" />
                            ))}
                            {(node.capabilities || []).length > 3 && (
                              <Chip
                                label={`+${(node.capabilities || []).length - 3}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {node.lastSeenAt
                            ? new Date(node.lastSeenAt).toLocaleString()
                            : t('common.never')}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title={t('nodes.token.showToken')}>
                              <IconButton
                                size="small"
                                onClick={() => handleIssueToken(node.id, false)}
                              >
                                <Key size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('nodes.token.rotateToken')}>
                              <IconButton
                                size="small"
                                onClick={() => handleIssueToken(node.id, true)}
                              >
                                <RefreshCw size={18} />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              onClick={() => handleEditNode(node)}
                            >
                              <Edit2 size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteNode(node.id)}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Node 对话框 */}
      <Dialog open={showNodeDialog} onClose={() => setShowNodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingNode ? t('nodes.editTitle') : t('nodes.createTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('nodes.form.id')}
              value={nodeForm.id}
              onChange={(e) => setNodeForm({ ...nodeForm, id: e.target.value })}
              disabled={!!editingNode}
              helperText={t('nodes.form.idHelper')}
            />
            <TextField
              fullWidth
              label={t('common.name')}
              value={nodeForm.name}
              onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('common.description')}
              value={nodeForm.description}
              onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label={t('nodes.capabilities')}
              value={nodeForm.capabilities}
              onChange={(e) => setNodeForm({ ...nodeForm, capabilities: e.target.value })}
              helperText={t('nodes.capabilitiesHelper')}
              placeholder="chat, embeddings, rerank"
            />
            <TextField
              fullWidth
              label={t('nodes.tags')}
              value={nodeForm.tags}
              onChange={(e) => setNodeForm({ ...nodeForm, tags: e.target.value })}
              helperText={t('nodes.tagsHelper')}
              placeholder="gpu, high-memory, us-west"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={nodeForm.enabled}
                  onChange={(e) => setNodeForm({ ...nodeForm, enabled: e.target.checked })}
                />
              }
              label={t('common.enabled')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNodeDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveNode}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Token 对话框 */}
      <Dialog open={showTokenDialog} onClose={() => setShowTokenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('nodes.token.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {tokenData && (
              <>
                <Alert severity="warning">
                  {t('nodes.token.warning')}
                </Alert>
                <TextField
                  fullWidth
                  label={t('nodes.token.nodeId')}
                  value={tokenData.nodeId}
                  disabled
                />
                <TextField
                  fullWidth
                  label={t('nodes.token.version')}
                  value={tokenData.tokenVersion}
                  disabled
                />
                <TextField
                  fullWidth
                  label={t('nodes.token.token')}
                  value={tokenData.token}
                  disabled
                  multiline
                  maxRows={4}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={copyToken} edge="end">
                          <Copy size={18} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={copyToken}>
            {t('common.copy')}
          </Button>
          <Button onClick={() => setShowTokenDialog(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
