import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface DashboardStats {
  balance: number;
  totalUsage: number;
  totalRequests: number;
  totalCost: number;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats({
          balance: response.data.balance,
          totalUsage: response.data.totalUsage,
          totalRequests: 0,
          totalCost: 0,
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, token, navigate]);

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 头部 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Welcome, {user?.username}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage your API keys, usage, and billing
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 统计卡片 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Account Balance
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ${stats?.balance.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Usage
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {stats?.totalUsage || 0} tokens
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Requests
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {stats?.totalRequests || 0}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Cost
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ${stats?.totalCost.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 快速操作 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/api-keys')}
            >
              Manage API Keys
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/usage')}
            >
              View Usage
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/billing')}
            >
              View Billing
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/profile')}
            >
              Edit Profile
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/actions')}
            >
              Manage Actions
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* 用户信息 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Account Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="textSecondary">Username:</Typography>
              <Typography>{user?.username}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="textSecondary">Email:</Typography>
              <Typography>{user?.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="textSecondary">Role:</Typography>
              <Typography sx={{ textTransform: 'capitalize' }}>{user?.role}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="textSecondary">Account Status:</Typography>
              <Typography sx={{ color: user?.enabled ? 'success.main' : 'error.main' }}>
                {user?.enabled ? 'Active' : 'Disabled'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
