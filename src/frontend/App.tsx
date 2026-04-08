import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import type { Theme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ServerProvider } from './contexts/ServerContext';
import { useServer } from './contexts/ServerContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserLayout } from './components/UserLayout';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { UserApiKeysPage } from './pages/UserApiKeysPage';
import { UserRequestsPage } from './pages/UserRequestsPage';
import { UserUsagePage } from './pages/UserUsagePage';
import { UserBillingPage } from './pages/UserBillingPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UserSettingsPage } from './pages/UserSettingsPage';
import { UserInvitationPage } from './pages/UserInvitationPage';
import { UserChatPage } from './pages/UserChatPage';
import { ActionsPage } from './pages/ActionsPage';
import { ActionEditorPage } from './pages/ActionEditorPage';
import { ActionMarketplace } from './pages/ActionMarketplace';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminUserRequestsPage } from './pages/AdminUserRequestsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminNotificationsPage } from './pages/AdminNotificationsPage';
import { AdminRedeemCodesPage } from './pages/AdminRedeemCodesPage';
import { AdminProvidersPage } from './pages/AdminProvidersPage';
import { AdminNodesPage } from './pages/AdminNodesPage';
import { ModelMarketplace } from './pages/ModelMarketplace';
import ModelManager from './components/ModelManager';
import { NotFoundPage } from './pages/NotFoundPage';
import { DocsPage } from './pages/DocsPage';

// 创建新会话并重定向的组件
function ChatRedirect() {
  const { createNewSession, sessions, currentSessionId, sessionsLoading } = useChat();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        // 如果会话正在加载，等待加载完成
        if (sessionsLoading) {
          return;
        }

        // 如果有当前会话，直接跳转
        if (currentSessionId) {
          navigate(`/chat/session/${currentSessionId}`, { replace: true });
          setLoading(false);
          return;
        }

        // 如果有会话列表，跳转到第一个会话
        if (sessions.length > 0) {
          navigate(`/chat/session/${sessions[0].id}`, { replace: true });
          setLoading(false);
          return;
        }

        // 否则创建新会话并跳转
        const newSession = await createNewSession();
        if (newSession) {
          navigate(`/chat/session/${newSession.id}`, { replace: true });
          setLoading(false);
        } else {
          setError('Failed to create session');
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
        setError('Failed to initialize session');
      }
    };

    initSession();
  }, [currentSessionId, sessions.length, sessionsLoading, createNewSession, navigate]);

  // 如果会话正在加载，显示加载状态
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return null;
}

// 模型广场包装器 - 从 ServerContext 获取 models
function ModelMarketplaceWrapper() {
  const { models } = useServer();
  return <ModelMarketplace models={models} />;
}

// 创建主题的函数
function createAppTheme(mode: 'light' | 'dark', primaryColor: string, secondaryColor: string): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    cssVariables: true,
    colorSchemes: {
      dark: isDark,
      light: !isDark,
    },
    palette: {
      mode,
      primary: {
        main: primaryColor,
        contrastText: isDark ? '#001f2e' : '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        contrastText: isDark ? '#001d35' : '#ffffff',
      },
      background: {
        default: isDark ? '#0b0d10' : '#ffffff',
        paper: isDark ? '#14161a' : '#f5f5f5',
      },
    },
    typography: {
      fontFamily: '"Lexend", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif',
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
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
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
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 0,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 0,
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
              backgroundColor: isDark ? 'rgba(168, 199, 250, 0.16)' : 'rgba(168, 199, 250, 0.08)',
            },
          },
        },
      },
    },
  });
}

// 内部应用组件 - 使用 ThemeContext
function AppContent() {
  const { theme } = useTheme();
  const muiTheme = createAppTheme(theme.mode as 'light' | 'dark', theme.primaryColor, theme.secondaryColor);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <SidebarProvider>
        <ChatProvider>
        <ServerProvider>
          <Box sx={{ 
            width: '100vw', 
            maxWidth: '100vw', 
            overflowX: 'hidden',
            overflowY: 'auto',
          }}>
            <Routes>
            {/* 认证路由 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/docs" element={<DocsPage />} />

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
              path="/models"
              element={
                <ProtectedRoute>
                  <UserLayout>
                    <ModelMarketplaceWrapper />
                  </UserLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/keys"
              element={
                <ProtectedRoute>
                  <UserLayout>
                    <UserApiKeysPage />
                  </UserLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <UserLayout>
                    <UserRequestsPage />
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
              path="/settings"
              element={
                <ProtectedRoute>
                  <UserLayout>
                    <UserSettingsPage />
                  </UserLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invitation"
              element={
                <ProtectedRoute>
                  <UserLayout>
                    <UserInvitationPage />
                  </UserLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <UserLayout>
                    <ChatRedirect />
                  </UserLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/session/:id"
              element={
                <UserLayout>
                  <UserChatPage />
                </UserLayout>
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
            <Route
              path="/actions/edit/:id"
              element={
                <ProtectedRoute>
                  <ActionEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/actions/marketplace"
              element={
                <ProtectedRoute>
                  <UserLayout>
                    <ActionMarketplace />
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
            <Route
              path="/console/users/:userId/requests"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminUserRequestsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/console/models"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <ModelManager />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/console/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminSettingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/console/notifications"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminNotificationsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/console/redeem-codes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminRedeemCodesPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/console/providers"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminProvidersPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/console/nodes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminNodesPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* 管理员控制台重定向 */}
            <Route path="/console" element={<Navigate to="/console/dashboard" replace />} />

            {/* 默认重定向 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 捕获所有未定义的路由 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Box>
        </ServerProvider>
        </ChatProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}

export default App;
