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
  Chip,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import axios from 'axios';
import type { Invoice } from '../../types.js';
import { formatCurrency } from '../utils/currency';

interface BillingInfo {
  balance: number;
  invoices: Invoice[];
}

export function UserBillingPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeType, setChargeType] = useState('alipay');
  const [chargeLoading, setChargeLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchBillingInfo();
  }, [user, token, navigate]);

  const fetchBillingInfo = async () => {
    try {
      const response = await axios.get('/api/user/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBillingInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      setRedeemError('Please enter a redemption code');
      return;
    }

    setRedeemLoading(true);
    setRedeemError('');
    setRedeemSuccess('');

    try {
      const response = await axios.post(
        '/api/payment/redeem',
        { code: redeemCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRedeemSuccess(`Successfully redeemed! Added ${formatCurrency(response.data.amount)}`);
      setRedeemCode('');
      fetchBillingInfo();
      setTimeout(() => setRedeemDialogOpen(false), 1500);
    } catch (err: any) {
      setRedeemError(err.response?.data?.error || 'Failed to redeem code');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCharge = async () => {
    if (!chargeAmount || parseFloat(chargeAmount) <= 0) {
      return;
    }

    setChargeLoading(true);

    try {
      const response = await axios.post(
        '/api/payment/create',
        {
          type: chargeType,
          name: `Charge ${chargeAmount}`,
          money: parseFloat(chargeAmount),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.payUrl) {
        window.location.href = response.data.payUrl;
      } else if (response.data.qrCode) {
        // 显示二维码
        alert('Please scan the QR code to complete payment');
      }
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to create payment order');
    } finally {
      setChargeLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
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
          {t('billing.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('billing.description')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 账户余额 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('billing.currentBalance')}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {formatCurrency(billingInfo?.balance || 0, 2)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
              {t('billing.availableForUsage')}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 充值和兑换码按钮 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setChargeDialogOpen(true)}
        >
          Charge Balance
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setRedeemDialogOpen(true)}
        >
          Redeem Code
        </Button>
      </Box>

      {/* 发票列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('billing.invoices')}
          </Typography>
          {billingInfo && billingInfo.invoices.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('billing.period')}</TableCell>
                    <TableCell align="right">{t('billing.usage')}</TableCell>
                    <TableCell align="right">{t('dashboard.totalCost')}</TableCell>
                    <TableCell>{t('billing.status')}</TableCell>
                    <TableCell>{t('billing.created')}</TableCell>
                    <TableCell>{t('billing.dueDate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billingInfo.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{invoice.period}</TableCell>
                      <TableCell align="right">{invoice.totalUsage}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.totalCost)}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          color={getStatusColor(invoice.status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('billing.noInvoices')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 计费说明 */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('billing.billingInformation')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • {t('billing.prepaidModel')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • {t('billing.apiRequestDeduction')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • {t('billing.invoicesGenerated')}
          </Typography>
          <Typography variant="body2">
            • {t('billing.contactSupport')}
          </Typography>
        </CardContent>
      </Card>

      {/* 兑换码对话框 */}
      <Dialog open={redeemDialogOpen} onClose={() => setRedeemDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Redeem Code</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {redeemError && <Alert severity="error" sx={{ mb: 2 }}>{redeemError}</Alert>}
        {redeemSuccess && <Alert severity="success" sx={{ mb: 2 }}>{redeemSuccess}</Alert>}
        <TextField
          fullWidth
          label="Redemption Code"
          value={redeemCode}
          onChange={(e) => setRedeemCode(e.target.value)}
          disabled={redeemLoading}
          placeholder="Enter your redemption code"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRedeemDialogOpen(false)} disabled={redeemLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleRedeemCode}
          variant="contained"
          disabled={redeemLoading || !redeemCode.trim()}
        >
          {redeemLoading ? <CircularProgress size={24} /> : 'Redeem'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* 充值对话框 */}
    <Dialog open={chargeDialogOpen} onClose={() => setChargeDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Charge Balance</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          label="Amount"
          type="number"
          value={chargeAmount}
          onChange={(e) => setChargeAmount(e.target.value)}
          disabled={chargeLoading}
          inputProps={{ step: '0.01', min: '0.01' }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          select
          label="Payment Method"
          value={chargeType}
          onChange={(e) => setChargeType(e.target.value)}
          disabled={chargeLoading}
          SelectProps={{
            native: true,
          }}
        >
          <option value="alipay">Alipay</option>
          <option value="wxpay">WeChat Pay</option>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setChargeDialogOpen(false)} disabled={chargeLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleCharge}
          variant="contained"
          disabled={chargeLoading || !chargeAmount || parseFloat(chargeAmount) <= 0}
        >
          {chargeLoading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
        </Button>
      </DialogActions>
    </Dialog>
    </Container>
  );
}
