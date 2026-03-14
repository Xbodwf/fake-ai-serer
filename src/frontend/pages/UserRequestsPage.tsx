import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useServer } from '../contexts/ServerContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import RequestList from '../components/RequestList';

export function UserRequestsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const { connected, connectWebSocket, disconnectWebSocket } = useServer();

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // 进入页面时连接 WebSocket
    connectWebSocket();

    // 离开页面时断开 WebSocket
    return () => {
      disconnectWebSocket();
    };
  }, [user, token, navigate, connectWebSocket, disconnectWebSocket]);

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('nav.requests')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('requests.description')}
          </Typography>
        </Box>
        <Chip
          label={connected ? t('common.active') : t('common.disabled')}
          color={connected ? 'success' : 'default'}
          variant="outlined"
        />
      </Box>

      <Card>
        <CardContent>
          <RequestList />
        </CardContent>
      </Card>
    </Container>
  );
}