import { Box } from '@mui/material';
import { AdminNavBar } from './AdminNavBar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AdminNavBar />
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
