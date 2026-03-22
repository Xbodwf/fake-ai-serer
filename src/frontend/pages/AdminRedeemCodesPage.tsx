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
      alert('Please fill in all required fields');
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
      alert(err.response?.data?.error || 'Failed to create code');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this code?')) return;

    try {
      await axios.delete(`/api/admin/redeem-codes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCodes();
      fetchStats();
    } catch (err) {
      alert('Failed to delete code');
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
          Redemption Codes Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage redemption codes for user balance
        </Typography>
      </Box>

      {/* 统计信息 */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Codes
              </Typography>
              <Typography variant="h5">{stats.totalCodes}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h5" sx={{ color: 'success.main' }}>
                {stats.activeCodes}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Used
              </Typography>
              <Typography variant="h5" sx={{ color: 'warning.main' }}>
                {stats.usedCodes}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Amount
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
          Create New Code
        </Button>
      </Box>

      {/* 代码列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Redemption Codes
          </Typography>
          {codes.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Actions</TableCell>
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
                          label={code.status}
                          color={getStatusColor(code.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>{code.description || '-'}</TableCell>
                      <TableCell>
                        {new Date(code.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCode(code._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No redemption codes found
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 创建对话框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Redemption Code</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            disabled={createLoading}
            placeholder="e.g., SUMMER2024"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            disabled={createLoading}
            inputProps={{ step: '0.01', min: '0.01' }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={createLoading}
            placeholder="Optional description"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Expires At"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            disabled={createLoading}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCode}
            variant="contained"
            disabled={createLoading || !formData.code || !formData.amount}
          >
            {createLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
