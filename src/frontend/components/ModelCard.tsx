import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Button,
  Rating,
  Stack,
} from '@mui/material';
import { Zap, Eye } from 'lucide-react';
import type { Model } from '../../types.js';

interface ModelCardProps {
  model: Model;
  onSelect?: (model: Model) => void;
  onPreview?: (model: Model) => void;
}

export function ModelCard({ model, onSelect, onPreview }: ModelCardProps) {
  const formatPrice = (price?: number, unit?: string) => {
    if (!price) return 'Free';
    const unitLabel = unit === 'M' ? '/M tokens' : '/K tokens';
    return `$${price.toFixed(4)}${unitLabel}`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* 模型名称和标签 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {model.id}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              by {model.owned_by}
            </Typography>
          </Box>
          {model.isComposite && (
            <Chip
              icon={<Zap size={14} />}
              label="Composite"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* 描述 */}
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', minHeight: 40 }}>
          {model.description || 'No description available'}
        </Typography>

        {/* 特性标签 */}
        {model.supported_features && model.supported_features.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {model.supported_features.map((feature) => (
              <Chip key={feature} label={feature} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        {/* 模型标签 */}
        {model.tags && model.tags.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {model.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        )}

        {/* 价格信息 */}
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {model.pricing?.input && (
            <Typography variant="caption">
              Input: {formatPrice(model.pricing.input, model.pricing.unit)}
            </Typography>
          )}
          {model.pricing?.output && (
            <Typography variant="caption">
              Output: {formatPrice(model.pricing.output, model.pricing.unit)}
            </Typography>
          )}
        </Stack>

        {/* 上下文长度 */}
        {model.context_length && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Context: {(model.context_length / 1000).toFixed(0)}K tokens
          </Typography>
        )}

        {/* 评分 */}
        {model.pricing && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={3} readOnly size="small" />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              (42 reviews)
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        {onPreview && (
          <Button
            size="small"
            startIcon={<Eye size={16} />}
            onClick={() => onPreview(model)}
          >
            Preview
          </Button>
        )}
        {onSelect && (
          <Button
            size="small"
            variant="contained"
            onClick={() => onSelect(model)}
            sx={{ ml: 'auto' }}
          >
            Select
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
