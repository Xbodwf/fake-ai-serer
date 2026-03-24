import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import axios from 'axios';
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
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';

interface RedeemCode {
  _id: string;
  code: string;
  amount: number;
  status: 'active' | 'used' | 'expired';
  description?: string;
  createdAt: string;
  usedAt?: string;
  expiresAt?: string;
}

interface Stats {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  expiredCodes: number;
  totalAmount: number;
}

export function AdminRedeemCodesPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    amount: '',
    description: '',
    expiresAt: '',
  });

  useEffect(() => {
    fetchCodes();
    fetchStats();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await axios.get('/api/admin/redeem-codes?status=active&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCodes(response.data);
    } catch (err) {
      console.error('Failed to fetch codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/redeem-codes-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCreateCode = async () => {
    if (!formData.code || !formData.amount) {
      alert(t('redeemCodes.validation.requiredFields', 'Please fill in all required fields'));
      return;
    }

    setCreateLoading(true);
    try {
      await axios.post(
        '/api/admin/redeem-codes',
        {
          code: formData.code,
          amount: parseFloat(formData.amount),
          description: formData.description,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormData({ code: '', amount: '', description: '', expiresAt: '' });
      setCreateDialogOpen(false);
      fetchCodes();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || t('redeemCodes.errors.failedCreate', 'Failed to create code'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm(t('redeemCodes.confirmDelete', 'Are you sure you want to delete this code?'))) return;

    try {
      await axios.delete(`/api/admin/redeem-codes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCodes();
      fetchStats();
    } catch (err) {
      alert(t('redeemCodes.errors.failedDelete', 'Failed to delete code'));
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'used':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {t('redeemCodes.title', 'Redemption Codes Management')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('redeemCodes.description', 'Manage redemption codes for user balance')}
        </Typography>
      </Box>

      {/* 统计信息 */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('redeemCodes.stats.totalCodes', 'Total Codes')}
              </Typography>
              <Typography variant="h5">{stats.totalCodes}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('redeemCodes.stats.active', 'Active')}
              </Typography>
              <Typography variant="h5" sx={{ color: 'success.main' }}>
                {stats.activeCodes}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('redeemCodes.stats.used', 'Used')}
              </Typography>
              <Typography variant="h5" sx={{ color: 'warning.main' }}>
                {stats.usedCodes}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('redeemCodes.stats.totalAmount', 'Total Amount')}
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main' }}>
                {formatCurrency(stats.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 创建按钮 */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
        >
          {t('redeemCodes.createButton', 'Create New Code')}
        </Button>
      </Box>

      {/* 代码列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('redeemCodes.table.title', 'Redemption Codes')}
          </Typography>
          {codes.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('redeemCodes.table.code', 'Code')}</TableCell>
                    <TableCell align="right">{t('redeemCodes.table.amount', 'Amount')}</TableCell>
                    <TableCell>{t('redeemCodes.table.status', 'Status')}</TableCell>
                    <TableCell>{t('redeemCodes.table.description', 'Description')}</TableCell>
                    <TableCell>{t('redeemCodes.table.created', 'Created')}</TableCell>
                    <TableCell>{t('redeemCodes.table.expires', 'Expires')}</TableCell>
                    <TableCell>{t('common.actions', 'Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code._id}>
                      <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                        {code.code}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(code.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={t(`redeemCodes.statuses.${code.status}`, code.status)}
                          color={getStatusColor(code.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>{code.description || t('common.notAvailable', '-')}</TableCell>
                      <TableCell>
                        {new Date(code.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : t('common.notAvailable', '-')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCode(code._id)}
                        >
                          {t('common.delete', 'Delete')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('redeemCodes.empty', 'No redemption codes found')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 创建对话框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('redeemCodes.dialog.createTitle', 'Create Redemption Code')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label={t('redeemCodes.form.code', 'Code')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            disabled={createLoading}
            placeholder={t('redeemCodes.form.codePlaceholder', 'e.g., SUMMER2024')}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('redeemCodes.form.amount', 'Amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            disabled={createLoading}
            inputProps={{ step: '0.01', min: '0.01' }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('redeemCodes.form.description', 'Description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={createLoading}
            placeholder={t('redeemCodes.form.descriptionPlaceholder', 'Optional description')}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('redeemCodes.form.expiresAt', 'Expires At')}
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            disabled={createLoading}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleCreateCode}
            variant="contained"
            disabled={createLoading || !formData.code || !formData.amount}
          >
            {createLoading ? <CircularProgress size={24} /> : t('common.create', 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
