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
} from '@mui/material';
import { Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import type { User } from '../../types.js';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editBalance, setEditBalance] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);

  useEffect(() => {
    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchUsers();
  }, [user, token, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (u: User) => {
    setSelectedUser(u);
    setEditBalance(u.balance.toString());
    setEditEnabled(u.enabled);
    setShowEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      await axios.put(
        `/api/admin/users/${selectedUser.id}`,
        {
          balance: parseFloat(editBalance),
          enabled: editEnabled,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowEditDialog(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
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
            User Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage users, balances, and permissions
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/console/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {users.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No users found
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="right">Total Usage</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell align="right">${u.balance.toFixed(2)}</TableCell>
                      <TableCell align="right">{u.totalUsage}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          color={u.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.enabled ? 'Active' : 'Disabled'}
                          color={u.enabled ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(u)}
                          title="Edit user"
                        >
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(u.id)}
                          color="error"
                          title="Delete user"
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

      {/* 编辑用户对话框 */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Balance"
              type="number"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              inputProps={{ step: '0.01' }}
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Status
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={editEnabled ? 'contained' : 'outlined'}
                  onClick={() => setEditEnabled(true)}
                >
                  Enable
                </Button>
                <Button
                  variant={!editEnabled ? 'contained' : 'outlined'}
                  onClick={() => setEditEnabled(false)}
                >
                  Disable
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveUser}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
