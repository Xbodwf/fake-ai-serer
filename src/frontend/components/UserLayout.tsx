import { Box } from '@mui/material';
import { UserNavBar } from './UserNavBar';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <UserNavBar />
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
