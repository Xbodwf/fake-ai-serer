import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import type { Theme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { ServerProvider } from './contexts/ServerContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserLayout } from './components/UserLayout';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { UserApiKeysPage } from './pages/UserApiKeysPage';
import { UserUsagePage } from './pages/UserUsagePage';
import { UserBillingPage } from './pages/UserBillingPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ActionsPage } from './pages/ActionsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';

// Material Design 3 风格主题
const darkTheme: Theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    dark: true,
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#a8c7fa',
      contrastText: '#001f2e',
    },
    secondary: {
      main: '#d1e8ff',
      contrastText: '#001d35',
    },
    background: {
      default: '#0b0d10',
      paper: '#14161a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif',
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          margin: '4px 12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(168, 199, 250, 0.16)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AuthProvider>
          <ServerProvider>
            <Routes>
              {/* 认证路由 */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* 用户路由 */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserLayout>
                      <UserDashboard />
                    </UserLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-keys"
                element={
                  <ProtectedRoute>
                    <UserLayout>
                      <UserApiKeysPage />
                    </UserLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usage"
                element={
                  <ProtectedRoute>
                    <UserLayout>
                      <UserUsagePage />
                    </UserLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <UserLayout>
                      <UserBillingPage />
                    </UserLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserLayout>
                      <UserProfilePage />
                    </UserLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/actions"
                element={
                  <ProtectedRoute>
                    <UserLayout>
                      <ActionsPage />
                    </UserLayout>
                  </ProtectedRoute>
                }
              />

              {/* 管理员路由 */}
              <Route
                path="/console/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/console/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminUsersPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* 管理员控制台重定向 */}
              <Route path="/console" element={<Navigate to="/console/dashboard" replace />} />

              {/* 默认重定向 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ServerProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;