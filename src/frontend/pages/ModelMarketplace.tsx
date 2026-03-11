import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
} from '@mui/material';
import { Search, X } from 'lucide-react';
import { ModelCard } from '../components/ModelCard';
import type { Model } from '../../types.js';

interface ModelMarketplaceProps {
  models: Model[];
  onSelectModel?: (model: Model) => void;
}

export function ModelMarketplace({ models, onSelectModel }: ModelMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // 获取唯一的提供商
  const providers = useMemo(() => {
    const unique = new Set(models.map(m => m.owned_by));
    return Array.from(unique).sort();
  }, [models]);

  // 获取所有分类
  const categories = useMemo(() => {
    const unique = new Set(models.map(m => m.category || 'other'));
    return Array.from(unique).sort();
  }, [models]);

  // 过滤模型
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !model.id.toLowerCase().includes(query) &&
          !model.description?.toLowerCase().includes(query) &&
          !model.owned_by.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 分类过滤
      if (selectedCategory !== 'all' && (model.category || 'other') !== selectedCategory) {
        return false;
      }

      // 提供商过滤
      if (selectedProvider !== 'all' && model.owned_by !== selectedProvider) {
        return false;
      }

      // 价格过滤
      const inputPrice = model.pricing?.input || 0;
      if (inputPrice < priceRange[0] || inputPrice > priceRange[1]) {
        return false;
      }

      return true;
    });
  }, [models, searchQuery, selectedCategory, selectedProvider, priceRange]);

  const handlePreview = (model: Model) => {
    setSelectedModel(model);
    setShowDetails(true);
  };

  const handleSelect = (model: Model) => {
    if (onSelectModel) {
      onSelectModel(model);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 标题 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Model Marketplace
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Discover and select from {models.length} available models
        </Typography>
      </Box>

      {/* 搜索和过滤 */}
      <Box sx={{ mb: 4 }}>
        <Stack spacing={2}>
          {/* 搜索框 */}
          <TextField
            fullWidth
            placeholder="Search models by name, description, or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
            }}
          />

          {/* 过滤器 */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                label="Provider"
              >
                <MenuItem value="all">All Providers</MenuItem>
                {providers.map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {provider}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Price Range</InputLabel>
              <Select
                value={`${priceRange[0]}-${priceRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setPriceRange([min, max]);
                }}
                label="Price Range"
              >
                <MenuItem value="0-1">All Prices</MenuItem>
                <MenuItem value="0-0.1">Free - $0.1</MenuItem>
                <MenuItem value="0.1-0.5">$0.1 - $0.5</MenuItem>
                <MenuItem value="0.5-1">$0.5 - $1</MenuItem>
              </Select>
            </FormControl>

            {(searchQuery || selectedCategory !== 'all' || selectedProvider !== 'all') && (
              <Button
                variant="outlined"
                startIcon={<X size={16} />}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedProvider('all');
                  setPriceRange([0, 1]);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* 结果计数 */}
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Showing {filteredModels.length} of {models.length} models
      </Typography>

      {/* 模型网格 */}
      {filteredModels.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onSelect={handleSelect}
              onPreview={handlePreview}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6">No models found</Typography>
          <Typography variant="body2">Try adjusting your search or filters</Typography>
        </Box>
      )}

      {/* 模型详情对话框 */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        {selectedModel && (
          <>
            <DialogTitle>{selectedModel.id}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Provider
                  </Typography>
                  <Typography variant="body2">{selectedModel.owned_by}</Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Description
                  </Typography>
                  <Typography variant="body2">{selectedModel.description}</Typography>
                </Box>

                {selectedModel.pricing && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Pricing
                      </Typography>
                      <Stack spacing={0.5}>
                        {selectedModel.pricing.input && (
                          <Typography variant="body2">
                            Input: ${selectedModel.pricing.input.toFixed(4)}/{selectedModel.pricing.unit || 'K'} tokens
                          </Typography>
                        )}
                        {selectedModel.pricing.output && (
                          <Typography variant="body2">
                            Output: ${selectedModel.pricing.output.toFixed(4)}/{selectedModel.pricing.unit || 'K'} tokens
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </>
                )}

                {selectedModel.supported_features && selectedModel.supported_features.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Features
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {selectedModel.supported_features.map((feature) => (
                          <Chip key={feature} label={feature} size="small" />
                        ))}
                      </Box>
                    </Box>
                  </>
                )}

                {selectedModel.context_length && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Context Length
                      </Typography>
                      <Typography variant="body2">
                        {(selectedModel.context_length / 1000000).toFixed(1)}M tokens
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetails(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleSelect(selectedModel);
                  setShowDetails(false);
                }}
              >
                Select Model
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
