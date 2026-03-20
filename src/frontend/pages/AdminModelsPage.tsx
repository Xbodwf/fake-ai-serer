import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import axios from 'axios';
import type { Model } from '../../types.js';

export function AdminModelsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    owned_by: '',
    category: '',
    icon: '',
  });
  const [pricing, setPricing] = useState({
    input: 0,
    output: 0,
    unit: 'K' as 'K' | 'M',
    type: 'token' as 'token' | 'request',
    perRequest: 0,
  });

  useEffect(() => {
    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchModels();
  }, [user, token, navigate]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/models', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModels(response.data.models || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async () => {
    if (!formData.id.trim()) {
      setError(t('models.idRequired'));
      return;
    }

    try {
      setError('');
      await axios.post(
        '/api/admin/models',
        {
          ...formData,
          pricing: pricing.type === 'request' ? { perRequest: pricing.perRequest } : pricing,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCreateDialog(false);
      setFormData({ id: '', description: '', owned_by: '', category: '', icon: '' });
      setPricing({ input: 0, output: 0, unit: 'K', type: 'token', perRequest: 0 });
      setSuccess(t('models.createdSuccessfully'));
      await fetchModels();
    } catch (err: any) {
      setError(err.response?.data?.error || t('models.failedToCreate'));
    }
  };

  const handleEditModel = (model: Model) => {
    setSelectedModel(model);
    setFormData({
      id: model.id,
      description: model.description || '',
      owned_by: model.owned_by || '',
      category: model.category || '',
      icon: model.icon || '',
    });
    setPricing({
      input: model.pricing?.input || 0,
      output: model.pricing?.output || 0,
      unit: (model.pricing?.unit || 'K') as 'K' | 'M',
      type: (model.pricing?.type || 'token') as 'token' | 'request',
      perRequest: model.pricing?.perRequest || 0,
    });
    setShowEditDialog(true);
  };

  const handleUpdateModel = async () => {
    if (!selectedModel) return;

    try {
      setError('');
      await axios.put(
        `/api/admin/models/${encodeURIComponent(selectedModel.id)}`,
        {
          ...formData,
          pricing: pricing.type === 'request' ? { perRequest: pricing.perRequest } : pricing,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditDialog(false);
      setSelectedModel(null);
      setSuccess(t('models.updatedSuccessfully'));
      await fetchModels();
    } catch (err: any) {
      setError(err.response?.data?.error || t('models.failedToUpdate'));
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm(t('models.confirmDelete'))) return;

    try {
      setError('');
      await axios.delete(`/api/admin/models/${encodeURIComponent(modelId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t('models.deletedSuccessfully'));
      await fetchModels();
    } catch (err: any) {
      setError(err.response?.data?.error || t('models.failedToDelete'));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('admin.models')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('admin.manageModels')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => {
            setSelectedModel(null);
            setFormData({ id: '', description: '', owned_by: '', category: '', icon: '' });
            setPricing({ input: 0, output: 0, unit: 'K', type: 'token', perRequest: 0 });
            setShowCreateDialog(true);
          }}
        >
          {t('models.addModel')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {models.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('models.noModels')}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>ID</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Pricing</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {model.id}
                      </TableCell>
                      <TableCell>{model.description || '-'}</TableCell>
                      <TableCell>{model.owned_by || '-'}</TableCell>
                      <TableCell>
                        <Chip label={model.category || 'other'} size="small" />
                      </TableCell>
                      <TableCell>
                        {model.pricing?.type === 'request'
                          ? `🔮${model.pricing.perRequest}/req`
                          : `$${model.pricing?.input || 0}/${model.pricing?.unit || 'K'}`}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => handleEditModel(model)}
                            title={t('common.edit')}
                          >
                            <Edit2 size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteModel(model.id)}
                            color="error"
                            title={t('common.delete')}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑模型对话框 */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedModel(null);
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {showEditDialog ? t('models.editModel') : t('models.createModel')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Model ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={showEditDialog}
              placeholder="gpt-4, claude-3-opus, etc."
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Provider"
              value={formData.owned_by}
              onChange={(e) => setFormData({ ...formData, owned_by: e.target.value })}
              placeholder="OpenAI, Anthropic, etc."
            />
            <TextField
              fullWidth
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="chat, image, video, etc."
            />
            <TextField
              fullWidth
              label="Icon URL"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="/static/models/icon.png"
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
              Pricing
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={pricing.type}
                onChange={(e) =>
                  setPricing({ ...pricing, type: e.target.value as any })
                }
                label="Type"
              >
                <MenuItem value="token">Token-based</MenuItem>
                <MenuItem value="request">Per-request</MenuItem>
              </Select>
            </FormControl>

            {pricing.type === 'token' ? (
              <>
                <TextField
                  fullWidth
                  type="number"
                  label="Input Price"
                  value={pricing.input}
                  onChange={(e) =>
                    setPricing({ ...pricing, input: parseFloat(e.target.value) || 0 })
                  }
                  inputProps={{ step: '0.0001' }}
                  size="small"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Output Price"
                  value={pricing.output}
                  onChange={(e) =>
                    setPricing({ ...pricing, output: parseFloat(e.target.value) || 0 })
                  }
                  inputProps={{ step: '0.0001' }}
                  size="small"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={pricing.unit}
                    onChange={(e) =>
                      setPricing({ ...pricing, unit: e.target.value as any })
                    }
                    label="Unit"
                  >
                    <MenuItem value="K">1K tokens</MenuItem>
                    <MenuItem value="M">1M tokens</MenuItem>
                  </Select>
                </FormControl>
              </>
            ) : (
              <TextField
                fullWidth
                type="number"
                label="Price per Request"
                value={pricing.perRequest}
                onChange={(e) =>
                  setPricing({ ...pricing, perRequest: parseFloat(e.target.value) || 0 })
                }
                inputProps={{ step: '0.0001' }}
                size="small"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              setSelectedModel(null);
              setError('');
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={showEditDialog ? handleUpdateModel : handleCreateModel}
          >
            {showEditDialog ? t('common.update') : t('actions.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
