import { useState, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Menu as MenuIcon, LogOut, Settings as SettingsIcon, BookOpen, LayoutDashboard, Key, CreditCard, Activity, BarChart3, FileText, ShoppingBag, Zap, MessageSquare, ChevronLeft, ChevronRight, X, ChevronDown, User, MessageSquare as ChatIcon, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useChat } from '../contexts/ChatContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { t = (key: string, defaultValue?: string) => defaultValue || key } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mobileOpen, setMobileOpen, sidebarCollapsed, toggleSidebarCollapsed } = useSidebar();
  const { sessions, currentSessionId, setCurrentSessionId, sessionsPanelOpen, setSessionsPanelOpen, createNewSession, deleteSession } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 在非移动设备上导航时关闭侧边栏
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile, setMobileOpen]);

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { label: t('userNav.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: t('nav.modelMarketplace'), path: '/models', icon: <ShoppingBag size={20} /> },
    { label: t('userNav.chat', '聊天'), path: '/chat', icon: <MessageSquare size={20} />, isActive: (pathname: string) => pathname === '/chat' || pathname.startsWith('/chat/session/') },
    { label: t('actionMarketplace.title', 'Action Marketplace'), path: '/actions/marketplace', icon: <Zap size={20} /> },
    { label: t('userNav.apiKeys'), path: '/keys', icon: <Key size={20} /> },
    { label: t('userNav.invitation'), path: '/invitation', icon: <FileText size={20} /> },
    { label: t('userNav.requests'), path: '/requests', icon: <Activity size={20} /> },
    { label: t('userNav.usage'), path: '/usage', icon: <BarChart3 size={20} /> },
    { label: t('userNav.billing'), path: '/billing', icon: <CreditCard size={20} /> },
  ];

  const accountItems = [
    { label: t('userNav.profile'), path: '/profile', icon: <SettingsIcon size={20} /> },
    { label: t('userNav.actions'), path: '/actions', icon: <Zap size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const [sessionMenuAnchor, setSessionMenuAnchor] = useState<null | HTMLElement>(null);
  const handleSessionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSessionMenuAnchor(event.currentTarget);
  };
  const handleSessionMenuClose = () => {
    setSessionMenuAnchor(null);
  };

  // 长按处理
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedSessionForMenu, setSelectedSessionForMenu] = useState<string | null>(null);

  const handleTouchStart = (sessionId: string) => {
    const timer = setTimeout(() => {
      setSelectedSessionForMenu(sessionId);
      setDeleteConfirmOpen(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    const sessionIdToDelete = selectedSessionForMenu || sessionToDelete;
    if (sessionIdToDelete) {
      deleteSession(sessionIdToDelete);
    }
    setDeleteConfirmOpen(false);
    setSessionToDelete(null);
    setSelectedSessionForMenu(null);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* 主菜单 */}
      <List sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <Tooltip key={item.path} title={sidebarCollapsed ? item.label : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                selected={item.isActive ? item.isActive(location.pathname) : location.pathname === item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: sidebarCollapsed ? 1 : 1,
                  my: 0.5,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  px: sidebarCollapsed ? 1 : 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: sidebarCollapsed ? 'auto' : 40, display: 'flex', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}

        {/* 账户菜单 */}
        {!sidebarCollapsed && <Divider sx={{ my: 1, mx: 2 }} />}
        {!sidebarCollapsed && (
          <Typography 
            variant="caption" 
            sx={{ 
              px: 3, 
              py: 1,
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {t('user.account', 'Account')}
          </Typography>
        )}
        {accountItems.map((item) => (
          <Tooltip key={item.path} title={sidebarCollapsed ? item.label : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: sidebarCollapsed ? 1 : 1,
                  my: 0.5,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  px: sidebarCollapsed ? 1 : 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: sidebarCollapsed ? 'auto' : 40, display: 'flex', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}

        {/* 管理员控制台 */}
        {isAdmin && (
          <Tooltip key="admin-console" title={sidebarCollapsed ? t('userNav.adminConsole', '管理员控制台') : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigate('/console/dashboard')}
                sx={{
                  borderRadius: 2,
                  mx: sidebarCollapsed ? 1 : 1,
                  my: 0.5,
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  px: sidebarCollapsed ? 1 : 1,
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: sidebarCollapsed ? 'auto' : 40, display: 'flex', justifyContent: 'center', color: 'inherit' }}>
                  <SettingsIcon size={20} />
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText 
                    primary={t('userNav.adminConsole', '管理员控制台')}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        )}
      </List>

      {/* 语言和主题切换 */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', maxWidth: '100vw', overflow: 'hidden' }}>
      {/* 桌面端顶部栏 - 始终显示 */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: sidebarCollapsed ? 0 : DRAWER_WIDTH,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* 只在侧边栏折叠时显示菜单按钮 */}
          {sidebarCollapsed && (
            <IconButton
              onClick={toggleSidebarCollapsed}
              color="inherit"
              sx={{ mr: 1 }}
            >
              <MenuIcon size={24} />
            </IconButton>
          )}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
            {/* 会话切换按钮 - 只在聊天页面且用户登录时显示 */}
            {(location.pathname === '/chat' || location.pathname.startsWith('/chat/session/')) && user && (
              <>
                <Chip
                  size="small"
                  label={sessions.find(s => s.id === currentSessionId)?.title || '选择会话'}
                  onClick={handleSessionMenuOpen}
                  icon={<ChatIcon size={14} />}
                  deleteIcon={<ChevronDown size={14} />}
                  onDelete={handleSessionMenuOpen as any}
                  sx={{
                    mr: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    maxWidth: 200,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
                <Menu
                  anchorEl={sessionMenuAnchor}
                  open={Boolean(sessionMenuAnchor)}
                  onClose={handleSessionMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{ sx: { borderRadius: '12px', minWidth: 200, maxHeight: 400 } }}
                >
                  <MenuItem
                    onClick={async () => {
                      const newSession = await createNewSession();
                      if (newSession) {
                        navigate(`/chat/session/${newSession.id}`);
                      }
                      handleSessionMenuClose();
                    }}
                    sx={{ borderRadius: '8px', mx: 0.5, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    <Plus size={16} style={{ marginRight: 12 }} />
                    {t('chat.newSession', '新对话')}
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  {sessions.map((session) => (
                    <MenuItem
                      key={session.id}
                      onClick={() => {
                        setCurrentSessionId(session.id);
                        navigate(`/chat/session/${session.id}`);
                        handleSessionMenuClose();
                      }}
                      onTouchStart={() => handleTouchStart(session.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                      selected={currentSessionId === session.id}
                      sx={{ 
                        borderRadius: '8px', 
                        mx: 0.5, 
                        display: 'flex', 
                        alignItems: 'center',
                        py: 1,
                        px: 1,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                        <ListItemText
                          primary={session.title}
                          secondary={`${session.messages.length} 条消息`}
                          primaryTypographyProps={{
                            noWrap: true,
                            fontWeight: currentSessionId === session.id ? 600 : 400,
                            fontSize: '0.875rem',
                          }}
                          secondaryTypographyProps={{
                            noWrap: true,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteClick(session.id, e)}
                        sx={{ 
                          ml: 'auto',
                          p: 0.5,
                          minWidth: 32,
                          height: 32,
                          color: 'error.main', 
                          bgcolor: alpha('#ef4444', 0.1),
                          '&:hover': { 
                            bgcolor: alpha('#ef4444', 0.2),
                          } 
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            <LanguageSwitcher />
            <ThemeSwitcher />
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleUserMenuOpen}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <ChevronDown size={14} style={{ color: 'currentColor' }} />
              </Box>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={() => { handleNavigate('/login'); }}
                sx={{ borderRadius: '8px', textTransform: 'none', px: 2 }}
              >
                {t('common.login')}
              </Button>
            )}
          </Stack>
          {user && (
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => { handleNavigate('/profile'); handleUserMenuClose(); }}>
                <User size={18} style={{ marginRight: 12 }} />
                {t('userNav.profile')}
              </MenuItem>
              {isAdmin && (
                <MenuItem onClick={() => { handleNavigate('/console/dashboard'); handleUserMenuClose(); }}>
                  <SettingsIcon size={18} style={{ marginRight: 12 }} />
                  {t('userNav.adminConsole')}
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={() => { handleLogout(); handleUserMenuClose(); }} sx={{ color: 'error.main' }}>
                <LogOut size={18} style={{ marginRight: 12 }} />
                {t('common.logout')}
              </MenuItem>
            </Menu>
          )}
        </Box>
      )}

      {/* 桌面端侧边栏 - 展开时显示 */}
      {!isMobile && !sidebarCollapsed && (
        <Box
          sx={{
            width: DRAWER_WIDTH,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            zIndex: (theme) => theme.zIndex.drawer,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="h6">{t('nav.menu')}</Typography>
            <IconButton onClick={toggleSidebarCollapsed}>
              <X size={24} />
            </IconButton>
          </Box>
          {drawer}
        </Box>
      )}

      {/* 移动端抽屉 */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { width: DRAWER_WIDTH } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="h6">{t('nav.menu')}</Typography>
            <IconButton onClick={() => setMobileOpen(false)}>
              <X size={24} />
            </IconButton>
          </Box>
          {drawer}
        </Drawer>
      )}

      {/* 移动端顶部栏 */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            color="inherit"
          >
            <MenuIcon size={24} />
          </IconButton>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* 会话切换按钮 - 只在聊天页面且用户登录时显示 */}
            {(location.pathname === '/chat' || location.pathname.startsWith('/chat/session/')) && user && (
              <>
                <Chip
                  size="small"
                  label={sessions.find(s => s.id === currentSessionId)?.title || '选择会话'}
                  onClick={handleSessionMenuOpen}
                  icon={<ChatIcon size={14} />}
                  deleteIcon={<ChevronDown size={14} />}
                  onDelete={handleSessionMenuOpen as any}
                  sx={{
                    mx: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    maxWidth: 150,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
                <Menu
                  anchorEl={sessionMenuAnchor}
                  open={Boolean(sessionMenuAnchor)}
                  onClose={handleSessionMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{ sx: { borderRadius: '12px', minWidth: 200, maxHeight: 400 } }}
                >
                  <MenuItem
                    onClick={async () => {
                      const newSession = await createNewSession();
                      if (newSession) {
                        navigate(`/chat/session/${newSession.id}`);
                      }
                      handleSessionMenuClose();
                    }}
                    sx={{ borderRadius: '8px', mx: 0.5, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    <Plus size={16} style={{ marginRight: 12 }} />
                    {t('chat.newSession', '新对话')}
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  {sessions.map((session) => (
                    <MenuItem
                      key={session.id}
                      onClick={() => {
                        setCurrentSessionId(session.id);
                        navigate(`/chat/session/${session.id}`);
                        handleSessionMenuClose();
                      }}
                      onTouchStart={() => handleTouchStart(session.id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                      selected={currentSessionId === session.id}
                      sx={{ borderRadius: '8px', mx: 0.5 }}
                    >
                      <ListItemText
                        primary={session.title}
                        secondary={`${session.messages.length} 条消息`}
                        primaryTypographyProps={{
                          noWrap: true,
                          fontWeight: currentSessionId === session.id ? 600 : 400,
                          fontSize: '0.875rem',
                        }}
                        secondaryTypographyProps={{
                          noWrap: true,
                          fontSize: '0.75rem',
                        }}
                      />
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            <LanguageSwitcher />
            <ThemeSwitcher />
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleUserMenuOpen}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <ChevronDown size={14} style={{ color: 'currentColor' }} />
              </Box>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={() => { handleNavigate('/login'); }}
                sx={{ borderRadius: '8px', textTransform: 'none', px: 2 }}
              >
                {t('common.login')}
              </Button>
            )}
          </Stack>
          {user && (
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => { handleNavigate('/profile'); handleUserMenuClose(); }}>
                <User size={18} style={{ marginRight: 12 }} />
                {t('userNav.profile')}
              </MenuItem>
              {isAdmin && (
                <MenuItem onClick={() => { handleNavigate('/console/dashboard'); handleUserMenuClose(); }}>
                  <SettingsIcon size={18} style={{ marginRight: 12 }} />
                  {t('userNav.adminConsole')}
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={() => { handleLogout(); handleUserMenuClose(); }} sx={{ color: 'error.main' }}>
                <LogOut size={18} style={{ marginRight: 12 }} />
                {t('common.logout')}
              </MenuItem>
            </Menu>
          )}
        </Box>
      )}

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSessionToDelete(null);
          setSelectedSessionForMenu(null);
        }}
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{t('chat.deleteConfirm', '确认删除')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('chat.deleteConfirmDesc', '确定要删除这个对话吗？此操作无法撤销。')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setDeleteConfirmOpen(false);
            setSessionToDelete(null);
            setSelectedSessionForMenu(null);
          }} sx={{ borderRadius: '8px' }}>
            {t('common.cancel', '取消')}
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ borderRadius: '8px' }}>
            {t('common.delete', '删除')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 主内容区 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100vw', md: '100%' },
          minHeight: '100vh',
          maxWidth: { xs: '100vw', md: '100%' },
          overflow: 'hidden',
          pt: { xs: 10, md: 10 },
        }}
      >
        {/* 内容区域 */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: (location.pathname === '/chat' || location.pathname.startsWith('/chat/session/')) ? 'hidden' : 'auto',
          width: '100%',
          minHeight: 0,
          height: 0,
          position: 'relative',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
