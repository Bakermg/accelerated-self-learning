import React from 'react';
import { Paper, Box, IconButton, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface MobileBottomNavProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  submitted: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  canSubmit,
  submitted,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile || submitted) {
    return null;
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: '16px 16px 0 0',
        p: 2,
        background: theme.palette.background.paper,
        borderTop: `2px solid ${theme.palette.primary.main}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <IconButton
          onClick={onPrevious}
          disabled={currentQuestion === 0}
          aria-label="Previous question"
          color="primary"
          size="large"
        >
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestion + 1} of {totalQuestions}
          </Typography>
          {canSubmit && (
            <Button
              variant="contained"
              size="small"
              onClick={onSubmit}
              startIcon={<CheckCircleIcon />}
              aria-label="Submit quiz"
              sx={{ mt: 1 }}
            >
              Submit Quiz
            </Button>
          )}
        </Box>

        <IconButton
          onClick={onNext}
          disabled={currentQuestion === totalQuestions - 1}
          aria-label="Next question"
          color="primary"
          size="large"
        >
          <ArrowForwardIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};
