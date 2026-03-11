import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Stack,
  Button,
  Tooltip,
} from '@mui/material';
import { Palette, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { isValidColor } from '../utils/theme';

export function ThemeSwitcher() {
  const { theme, toggleMode, updatePrimaryColor, updateSecondaryColor, updateAccentColor, resetTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    if (isValidColor(value)) {
      if (colorType === 'primary') updatePrimaryColor(value);
      else if (colorType === 'secondary') updateSecondaryColor(value);
      else if (colorType === 'accent') updateAccentColor(value);
    }
  };

  return (
    <>
      <Tooltip title="主题设置">
        <IconButton onClick={handleMenuOpen} size="small">
          <Palette size={20} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 300 },
        }}
      >
        {/* 主题模式切换 */}
        <MenuItem onClick={() => { toggleMode(); handleMenuClose(); }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            {theme.mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme.mode === 'dark' ? '切换到亮色' : '切换到暗色'}</span>
          </Box>
        </MenuItem>

        <Divider />

        {/* 颜色自定义 */}
        <MenuItem onClick={() => setShowColorPicker(!showColorPicker)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Palette size={18} />
            <span>自定义颜色</span>
          </Box>
        </MenuItem>

        {showColorPicker && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {/* 主色调 */}
                <Box>
                  <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>主色调</label>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      style={{ width: 40, height: 40, cursor: 'pointer', borderRadius: 8 }}
                    />
                    <TextField
                      size="small"
                      value={theme.primaryColor}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>

                {/* 辅助色 */}
                <Box>
                  <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>辅助色</label>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <input
                      type="color"
                      value={theme.secondaryColor}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      style={{ width: 40, height: 40, cursor: 'pointer', borderRadius: 8 }}
                    />
                    <TextField
                      size="small"
                      value={theme.secondaryColor}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>

                {/* 强调色 */}
                <Box>
                  <label style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>强调色</label>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      style={{ width: 40, height: 40, cursor: 'pointer', borderRadius: 8 }}
                    />
                    <TextField
                      size="small"
                      value={theme.accentColor}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>

                {/* 重置按钮 */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => { resetTheme(); setShowColorPicker(false); }}
                  fullWidth
                >
                  重置为默认
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
