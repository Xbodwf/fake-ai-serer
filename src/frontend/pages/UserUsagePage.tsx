import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  byEndpoint: Record<string, { requests: number; tokens: number; cost: number }>;
}

export function UserUsagePage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchUsageStats();
  }, [user, token, navigate]);

  const fetchUsageStats = async () => {
    try {
      const response = await axios.get('/api/user/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Usage Statistics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          View your API usage and costs
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 总体统计 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
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
              Total Tokens
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {stats?.totalTokens || 0}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Cost
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ${stats?.totalCost.toFixed(4) || '0.0000'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 按模型统计 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Usage by Model
          </Typography>
          {stats && Object.keys(stats.byModel).length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Requests</TableCell>
                    <TableCell align="right">Tokens</TableCell>
                    <TableCell align="right">Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.byModel).map(([model, data]) => (
                    <TableRow key={model}>
                      <TableCell>{model}</TableCell>
                      <TableCell align="right">{data.requests}</TableCell>
                      <TableCell align="right">{data.tokens}</TableCell>
                      <TableCell align="right">${data.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>No usage data</Typography>
          )}
        </CardContent>
      </Card>

      {/* 按端点统计 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Usage by Endpoint
          </Typography>
          {stats && Object.keys(stats.byEndpoint).length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Endpoint</TableCell>
                    <TableCell align="right">Requests</TableCell>
                    <TableCell align="right">Tokens</TableCell>
                    <TableCell align="right">Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.byEndpoint).map(([endpoint, data]) => (
                    <TableRow key={endpoint}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{endpoint}</TableCell>
                      <TableCell align="right">{data.requests}</TableCell>
                      <TableCell align="right">{data.tokens}</TableCell>
                      <TableCell align="right">${data.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>No usage data</Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
