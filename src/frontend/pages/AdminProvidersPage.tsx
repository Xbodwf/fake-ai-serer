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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import { Edit2, Trash2, Plus, Key, ChevronDown, Search, Link, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import axios from 'axios';
import type { Provider, ProviderApiKey } from '../types';

export function AdminProvidersPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 搜索
  const [searchText, setSearchText] = useState('');

  // Provider 对话框
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [providerForm, setProviderForm] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    enabled: true,
    api_type: 'openai' as Provider['api_type'],
    api_base_url: '',
  });

  // Key 对话框
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [keyProviderId, setKeyProviderId] = useState<string>('');
  const [editingKey, setEditingKey] = useState<ProviderApiKey | null>(null);
  const [keyForm, setKeyForm] = useState({
    id: '',
    name: '',
    key: '',
    enabled: true,
  });

  useEffect(() => {
    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchProviders();
  }, [user, token, navigate]);

  const fetchProviders = async () => {
    try {
      const response = await axios.get('/api/admin/providers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(response.data.providers || []);
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Provider 操作
  const handleCreateProvider = () => {
    setEditingProvider(null);
    setProviderForm({
      id: '',
      name: '',
      slug: '',
      description: '',
      enabled: true,
      api_type: 'openai',
      api_base_url: '',
    });
    setShowProviderDialog(true);
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setProviderForm({
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      description: provider.description || '',
      enabled: provider.enabled,
      api_type: provider.api_type,
      api_base_url: provider.api_base_url,
    });
    setShowProviderDialog(true);
  };

  const handleSaveProvider = async () => {
    if (!providerForm.id || !providerForm.name || !providerForm.slug || !providerForm.api_base_url) {
      setError(t('providers.validation.requiredFields'));
      return;
    }

    try {
      if (editingProvider) {
        await axios.put(
          `/api/admin/providers/${editingProvider.id}`,
          providerForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess(t('providers.updateSuccess'));
      } else {
        await axios.post(
          '/api/admin/providers',
          providerForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess(t('providers.createSuccess'));
      }
      setShowProviderDialog(false);
      await fetchProviders();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToCreate'));
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm(t('providers.confirmDelete'))) return;

    try {
      await axios.delete(`/api/admin/providers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t('providers.deleteSuccess'));
      await fetchProviders();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToDelete'));
    }
  };

  // Key 操作
  const handleAddKey = (providerId: string) => {
    setKeyProviderId(providerId);
    setEditingKey(null);
    setKeyForm({
      id: '',
      name: '',
      key: '',
      enabled: true,
    });
    setShowKeyDialog(true);
  };

  const handleEditKey = (provider: Provider, key: ProviderApiKey) => {
    setKeyProviderId(provider.id);
    setEditingKey(key);
    setKeyForm({
      id: key.id,
      name: key.name,
      key: '', // 不显示原 key
      enabled: key.enabled,
    });
    setShowKeyDialog(true);
  };

  const handleSaveKey = async () => {
    if (!keyForm.id || !keyForm.name || (!editingKey && !keyForm.key)) {
      setError(t('providers.keys.validation.requiredFields'));
      return;
    }

    try {
      if (editingKey) {
        await axios.put(
          `/api/admin/providers/${keyProviderId}/keys/${editingKey.id}`,
          { enabled: keyForm.enabled, name: keyForm.name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess(t('providers.keys.updateSuccess'));
      } else {
        await axios.post(
          `/api/admin/providers/${keyProviderId}/keys`,
          { keyId: keyForm.id, name: keyForm.name, key: keyForm.key, enabled: keyForm.enabled },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess(t('providers.keys.createSuccess'));
      }
      setShowKeyDialog(false);
      await fetchProviders();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToCreate'));
    }
  };

  const handleDeleteKey = async (providerId: string, keyId: string) => {
    if (!confirm(t('providers.keys.confirmDelete'))) return;

    try {
      await axios.delete(`/api/admin/providers/${providerId}/keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t('providers.keys.deleteSuccess'));
      await fetchProviders();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.failedToDelete'));
    }
  };

  // 过滤
  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchText.toLowerCase()) ||
    p.id.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('providers.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('providers.description')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => navigate('/console/dashboard')}>
            {t('admin.backToDashboard')}
          </Button>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleCreateProvider}>
            {t('providers.createButton')}
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

          {filteredProviders.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('providers.noProviders')}
            </Typography>
          ) : (
            <Stack spacing={2}>
              {filteredProviders.map((provider) => (
                <Accordion key={provider.id} defaultExpanded={false}>
                  <AccordionSummary 
                    expandIcon={<ChevronDown size={20} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        flexWrap: 'wrap',
                        gap: 1,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {provider.name}
                      </Typography>
                      <Chip
                        label={provider.slug}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <Chip
                        label={provider.api_type}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={provider.enabled ? t('common.active') : t('common.disabled')}
                        size="small"
                        color={provider.enabled ? 'success' : 'error'}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        ({provider.keys?.length || 0} {t('providers.keys.title').toLowerCase()})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ overflowX: 'auto' }}>
                    <Box sx={{ mb: 2, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                        <Link size={16} />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {provider.api_base_url}
                        </Typography>
                      </Stack>
                      {provider.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                          {provider.description}
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {t('providers.keys.title')}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          startIcon={<Edit2 size={16} />}
                          onClick={() => handleEditProvider(provider)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Trash2 size={16} />}
                          onClick={() => handleDeleteProvider(provider.id)}
                        >
                          {t('common.delete')}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Key size={16} />}
                          onClick={() => handleAddKey(provider.id)}
                        >
                          {t('providers.keys.addButton')}
                        </Button>
                      </Stack>
                    </Box>

                    {(!provider.keys || provider.keys.length === 0) ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                        {t('providers.keys.noKeys')}
                      </Typography>
                    ) : (
                      <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                              <TableCell>{t('common.name')}</TableCell>
                              <TableCell>{t('providers.keys.keyId')}</TableCell>
                              <TableCell>{t('common.status')}</TableCell>
                              <TableCell>{t('providers.keys.lastUsed')}</TableCell>
                              <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {provider.keys.map((key) => (
                              <TableRow key={key.id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{key.name}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{key.id}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={key.enabled ? t('common.active') : t('common.disabled')}
                                    size="small"
                                    color={key.enabled ? 'success' : 'error'}
                                  />
                                </TableCell>
                                <TableCell>
                                  {key.lastUsedAt
                                    ? new Date(key.lastUsedAt).toLocaleString()
                                    : t('common.never')}
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditKey(provider, key)}
                                    >
                                      <Edit2 size={16} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteKey(provider.id, key.id)}
                                    >
                                      <Trash2 size={16} />
                                    </IconButton>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Provider 对话框 */}
      <Dialog open={showProviderDialog} onClose={() => setShowProviderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProvider ? t('providers.editTitle') : t('providers.createTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('providers.form.id')}
              value={providerForm.id}
              onChange={(e) => setProviderForm({ ...providerForm, id: e.target.value })}
              disabled={!!editingProvider}
              helperText={t('providers.form.idHelper')}
            />
            <TextField
              fullWidth
              label={t('common.name')}
              value={providerForm.name}
              onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('providers.form.slug')}
              value={providerForm.slug}
              onChange={(e) => setProviderForm({ ...providerForm, slug: e.target.value })}
              helperText={t('providers.form.slugHelper')}
            />
            <TextField
              fullWidth
              label={t('common.description')}
              value={providerForm.description}
              onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>{t('providers.form.apiType')}</InputLabel>
              <Select
                value={providerForm.api_type}
                onChange={(e) => setProviderForm({ ...providerForm, api_type: e.target.value as Provider['api_type'] })}
                label={t('providers.form.apiType')}
              >
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="anthropic">Anthropic</MenuItem>
                <MenuItem value="google">Google</MenuItem>
                <MenuItem value="azure">Azure</MenuItem>
                <MenuItem value="custom">{t('models.manager.customApi')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={t('providers.form.apiBaseUrl')}
              value={providerForm.api_base_url}
              onChange={(e) => setProviderForm({ ...providerForm, api_base_url: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={providerForm.enabled}
                  onChange={(e) => setProviderForm({ ...providerForm, enabled: e.target.checked })}
                />
              }
              label={t('common.enabled')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProviderDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveProvider}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Key 对话框 */}
      <Dialog open={showKeyDialog} onClose={() => setShowKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingKey ? t('providers.keys.editTitle') : t('providers.keys.createTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('providers.keys.keyId')}
              value={keyForm.id}
              onChange={(e) => setKeyForm({ ...keyForm, id: e.target.value })}
              disabled={!!editingKey}
              helperText={t('providers.keys.keyIdHelper')}
            />
            <TextField
              fullWidth
              label={t('common.name')}
              value={keyForm.name}
              onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
            />
            {!editingKey && (
              <TextField
                fullWidth
                label={t('providers.keys.keyValue')}
                value={keyForm.key}
                onChange={(e) => setKeyForm({ ...keyForm, key: e.target.value })}
                type="password"
                helperText={t('providers.keys.keyValueHelper')}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={keyForm.enabled}
                  onChange={(e) => setKeyForm({ ...keyForm, enabled: e.target.checked })}
                />
              }
              label={t('common.enabled')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKeyDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveKey}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}