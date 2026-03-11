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
  Chip,
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import type { Action } from '../../types.js';

export function ActionsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAction, setNewAction] = useState({
    name: '',
    description: '',
    code: '',
  });

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchActions();
  }, [user, token, navigate]);

  const fetchActions = async () => {
    try {
      const response = await axios.get('/api/actions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async () => {
    if (!newAction.name.trim() || !newAction.code.trim()) {
      setError('Name and code are required');
      return;
    }

    try {
      await axios.post(
        '/api/actions',
        newAction,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewAction({ name: '', description: '', code: '' });
      setShowCreateDialog(false);
      await fetchActions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create action');
    }
  };

  const handleDeleteAction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this action?')) return;

    try {
      await axios.delete(`/api/actions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchActions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete action');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Actions
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Create and manage reusable actions for multi-model collaboration
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Action
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {actions.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No actions yet. Create one to get started.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{action.name}</TableCell>
                      <TableCell>{action.description}</TableCell>
                      <TableCell>
                        {new Date(action.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={action.isPublic ? 'Public' : 'Private'}
                          color={action.isPublic ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAction(action.id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 创建 Action 对话框 */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Action</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Action Name"
              value={newAction.name}
              onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={newAction.description}
              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
            />
            <TextField
              fullWidth
              label="Code"
              multiline
              rows={6}
              value={newAction.code}
              onChange={(e) => setNewAction({ ...newAction, code: e.target.value })}
              placeholder="TypeScript code"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAction}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
