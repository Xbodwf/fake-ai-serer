import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Slider,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useServer } from '../contexts/ServerContext';

export default function SettingsPage() {
  const { settings, updateSettings } = useServer();
  const [streamDelay, setStreamDelay] = useState(settings.streamDelay);
  const [saved, setSaved] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setStreamDelay(settings.streamDelay);
  }, [settings.streamDelay]);

  const handleSave = async () => {
    await updateSettings({ streamDelay });
    setSaved(true);
  };

  const formatDelay = (value: number) => {
    if (value < 1000) return `${value}ms`;
    return `${(value / 1000).toFixed(1)}s`;
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        系统设置
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            流式响应设置
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              延迟发送时间: {formatDelay(streamDelay)}
            </Typography>
            <Slider
              value={streamDelay}
              onChange={(_, value) => setStreamDelay(value as number)}
              min={0}
              max={3000}
              step={100}
              marks={[
                { value: 0, label: '0ms' },
                { value: 500, label: '500ms' },
                { value: 1000, label: '1s' },
                { value: 2000, label: '2s' },
                { value: 3000, label: '3s' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={formatDelay}
            />
            <Typography variant="caption" color="text.secondary">
              用户输入内容后，等待此时间再发送。如果在等待期间修改了内容，将重新计时。
            </Typography>
          </Box>

          <TextField
            label="延迟时间 (毫秒)"
            type="number"
            value={streamDelay}
            onChange={(e) => setStreamDelay(Math.max(0, parseInt(e.target.value) || 0))}
            size="small"
            sx={{ width: isMobile ? '100%' : 200, mb: 2 }}
            inputProps={{ min: 0, max: 10000, step: 100 }}
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            使用说明
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • <strong>即时返回模式</strong>：当延迟设为 0 时，用户输入后立即发送内容块。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • <strong>延迟返回模式</strong>：设置延迟后，用户输入内容会等待指定时间再发送，期间可以修改或删除内容。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • <strong>已发送内容</strong>：一旦内容发送成功，会以高亮样式显示，方便区分。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>防错别字</strong>：建议设置 300-1000ms 的延迟，给自己留出检查时间。
          </Typography>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={handleSave}
        fullWidth={isMobile}
      >
        保存设置
      </Button>

      <Snackbar
        open={saved}
        autoHideDuration={2000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          设置已保存
        </Alert>
      </Snackbar>
    </Box>
  );
}
