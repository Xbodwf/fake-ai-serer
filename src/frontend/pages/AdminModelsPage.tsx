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

const defaultFormData = {
  id: '',
  description: '',
  owned_by: '',
  type: 'text' as 'text' | 'image' | 'video' | 'tts' | 'stt' | 'embedding' | 'rerank' | 'responses',
  icon: '',
  api_key: '',
  api_base_url: '',
  api_type: 'openai' as 'openai' | 'anthropic' | 'google' | 'azure' | 'custom',
  forwardModelName: '',
  api_url_templates: {
    chat: '',
    embeddings: '',
    geminiGenerateContent: '',
    geminiEmbedContent: '',
  },
};

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
  const [formData, setFormData] = useState(defaultFormData);
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

  const normalizeApiUrlTemplates = () => {
    const entries = Object.entries(formData.api_url_templates)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  };

  const handleCreateModel = async () => {
    if (!formData.id.trim()) {
      setError(t('models.idRequired'));
      return;
    }

    try {
      setError('');
      const api_url_templates = normalizeApiUrlTemplates();

      await axios.post(
        '/api/admin/models',
        {
          ...formData,
          ...(api_url_templates ? { api_url_templates } : {}),
          pricing: pricing.type === 'request' ? { perRequest: pricing.perRequest } : pricing,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCreateDialog(false);
      setFormData(defaultFormData);
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
      type: model.type || 'text',
      icon: model.icon || '',
      api_key: model.api_key || '',
      api_base_url: model.api_base_url || '',
      api_type: model.api_type || 'openai',
      forwardModelName: model.forwardModelName || '',
      api_url_templates: {
        chat: model.api_url_templates?.chat || '',
        embeddings: model.api_url_templates?.embeddings || '',
        geminiGenerateContent: model.api_url_templates?.geminiGenerateContent || '',
        geminiEmbedContent: model.api_url_templates?.geminiEmbedContent || '',
      },
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
      const api_url_templates = normalizeApiUrlTemplates();

      await axios.put(
        `/api/admin/models/${encodeURIComponent(selectedModel.id)}`,
        {
          ...formData,
          ...(api_url_templates ? { api_url_templates } : {}),
          type: formData.type,
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
            setFormData(defaultFormData);
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
                    <TableCell>{t('models.details.description')}</TableCell>
                    <TableCell>{t('models.details.provider')}</TableCell>
                    <TableCell>{t('models.category')}</TableCell>
                    <TableCell>{t('models.details.pricing')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
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
                        <Chip label={model.type || 'text'} size="small" />
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {showEditDialog ? t('models.editModel') : t('models.createModel')}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* 基本信息 */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                {t('models.manager.basicInfo')}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('models.manager.modelId')}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={showEditDialog}
                  placeholder="gpt-4, claude-3-opus, etc."
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('common.description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('models.provider')}
                  value={formData.owned_by}
                  onChange={(e) => setFormData({ ...formData, owned_by: e.target.value })}
                  placeholder="OpenAI, Anthropic, etc."
                />
              </Stack>
            </Box>

            {/* 模型配置 */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                {t('models.manager.advancedSettings')}
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="model-type-label">{t('models.type')}</InputLabel>
                  <Select
                    labelId="model-type-label"
                    id="model-type-select"
                    value={formData.type || 'text'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    label={t('models.type')}
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="image">Image</MenuItem>
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="tts">TTS</MenuItem>
                    <MenuItem value="stt">STT</MenuItem>
                    <MenuItem value="embedding">Embedding</MenuItem>
                    <MenuItem value="rerank">Rerank</MenuItem>
                    <MenuItem value="responses">Responses</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  size="small"
                  label="Icon URL"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="/static/models/icon.png"
                />
              </Stack>
            </Box>

            {/* 转发配置 */}
 <Box>
 <Typography variant="subtitle2" sx={{ fontWeight:600, mb:2 }}>
 Forwarding
 </Typography>
 <Stack spacing={2}>
 <FormControl fullWidth size="small">
 <InputLabel id="api-type-label">API Type</InputLabel>
 <Select
 labelId="api-type-label"
 value={formData.api_type}
 label="API Type"
 onChange={(e) => setFormData({ ...formData, api_type: e.target.value as any })}
 >
 <MenuItem value="openai">OpenAI</MenuItem>
 <MenuItem value="anthropic">Anthropic</MenuItem>
 <MenuItem value="google">Google</MenuItem>
 <MenuItem value="azure">Azure</MenuItem>
 <MenuItem value="custom">Custom</MenuItem>
 </Select>
 </FormControl>
 <TextField
 fullWidth
 size="small"
 label="API Key"
 value={formData.api_key}
 onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
 placeholder="sk-..."
 />
 <TextField
 fullWidth
 size="small"
 label="API Base URL"
 value={formData.api_base_url}
 onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
 placeholder="https://api.openai.com/v1"
 />
 <TextField
 fullWidth
 size="small"
 label="Forward Model Name"
 value={formData.forwardModelName}
 onChange={(e) => setFormData({ ...formData, forwardModelName: e.target.value })}
 placeholder="留空则使用请求模型名"
 />
 <TextField
 fullWidth
 size="small"
 label="Chat URL Template"
 value={formData.api_url_templates.chat}
 onChange={(e) => setFormData({
 ...formData,
 api_url_templates: { ...formData.api_url_templates, chat: e.target.value }
 })}
 placeholder="{baseUrl}/chat/completions"
 helperText="变量: {baseUrl} {model} {forwardModel} {apiKey}"
 />
 <TextField
 fullWidth
 size="small"
 label="Embeddings URL Template"
 value={formData.api_url_templates.embeddings}
 onChange={(e) => setFormData({
 ...formData,
 api_url_templates: { ...formData.api_url_templates, embeddings: e.target.value }
 })}
 placeholder="{baseUrl}/embeddings"
 helperText="变量: {baseUrl} {model} {forwardModel} {apiKey}"
 />
 <TextField
 fullWidth
 size="small"
 label="Gemini Generate URL Template"
 value={formData.api_url_templates.geminiGenerateContent}
 onChange={(e) => setFormData({
 ...formData,
 api_url_templates: { ...formData.api_url_templates, geminiGenerateContent: e.target.value }
 })}
 placeholder="{baseUrl}/v1beta/models/{forwardModel}:generateContent?key={apiKey}"
 helperText="变量: {baseUrl} {model} {forwardModel} {apiKey}"
 />
 <TextField
 fullWidth
 size="small"
 label="Gemini Embeddings URL Template"
 value={formData.api_url_templates.geminiEmbedContent}
 onChange={(e) => setFormData({
 ...formData,
 api_url_templates: { ...formData.api_url_templates, geminiEmbedContent: e.target.value }
 })}
 placeholder="{baseUrl}/v1beta/models/{forwardModel}:embedContent?key={apiKey}"
 helperText="变量: {baseUrl} {model} {forwardModel} {apiKey}"
 />
 </Stack>
 </Box>

 {/* 定价 */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                {t('models.details.pricing')}
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="pricing-type-label">Pricing Type</InputLabel>
                  <Select
                    labelId="pricing-type-label"
                    id="pricing-type-select"
                    value={pricing.type}
                    onChange={(e) =>
                      setPricing({ ...pricing, type: e.target.value as any })
                    }
                    label="Pricing Type"
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
            </Box>
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
