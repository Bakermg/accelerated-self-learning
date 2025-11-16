import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';

interface ApiKeySetupProps {
  onKeySubmit: (apiKey: string, provider: 'anthropic' | 'openai') => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onKeySubmit }) => {
  const [provider, setProvider] = useState<'anthropic' | 'openai'>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleProviderChange = (
    _event: React.MouseEvent<HTMLElement>,
    newProvider: 'anthropic' | 'openai' | null,
  ) => {
    if (newProvider !== null) {
      setProvider(newProvider);
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    // Basic validation for key format
    if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
      setError('Anthropic API keys should start with "sk-ant-"');
      return;
    }

    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }

    onKeySubmit(apiKey, provider);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <KeyIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Welcome to AI Study Quiz
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              To get started, please enter your AI provider API key
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Select Your AI Provider
            </Typography>
            <ToggleButtonGroup
              value={provider}
              exclusive
              onChange={handleProviderChange}
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton value="anthropic" sx={{ py: 2 }}>
                <Box>
                  <Typography variant="button" sx={{ fontWeight: 600 }}>
                    Anthropic Claude
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ textTransform: 'none' }}>
                    Uses Claude Haiku
                  </Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="openai" sx={{ py: 2 }}>
                <Box>
                  <Typography variant="button" sx={{ fontWeight: 600 }}>
                    OpenAI
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ textTransform: 'none' }}>
                    Uses GPT-3.5/4
                  </Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label={`${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API Key`}
              type="password"
              fullWidth
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              helperText={
                provider === 'anthropic'
                  ? 'Get your key from console.anthropic.com'
                  : 'Get your key from platform.openai.com'
              }
              sx={{ mb: 2 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              sx={{
                py: 1.5,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5568d3 30%, #653a8b 90%)',
                },
              }}
            >
              Continue
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Note:</strong> Your API key is stored locally in your browser and sent directly to the
              AI provider. It is never stored on our servers.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
