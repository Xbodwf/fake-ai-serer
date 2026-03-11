import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeConfig } from '../../types.js';

/**
 * 根据 ThemeConfig 生成 Material-UI 主题
 */
export function generateMuiTheme(themeConfig: ThemeConfig): Theme {
  const isDark = themeConfig.mode === 'dark';

  return createTheme({
    cssVariables: true,
    colorSchemes: {
      dark: isDark,
      light: !isDark,
    },
    palette: {
      mode: themeConfig.mode,
      primary: {
        main: themeConfig.primaryColor,
        contrastText: isDark ? '#001f2e' : '#ffffff',
      },
      secondary: {
        main: themeConfig.secondaryColor,
        contrastText: isDark ? '#001d35' : '#ffffff',
      },
      background: {
        default: isDark ? '#0b0d10' : '#ffffff',
        paper: isDark ? '#14161a' : '#f5f5f5',
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
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
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
            borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
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
              backgroundColor: `${themeConfig.primaryColor}26`,
            },
          },
        },
      },
    },
  });
}

/**
 * 验证颜色值
 */
export function isValidColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const hslRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;

  return hexRegex.test(color) || rgbRegex.test(color) || hslRegex.test(color);
}

/**
 * 获取对比色（用于文本）
 */
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
