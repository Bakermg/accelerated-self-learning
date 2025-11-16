import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { quizStorage, QuizAttempt } from '../utils/quizStorage';

interface StatsData {
  totalAttempts: number;
  averageScore: string;
  averagePercentage: string;
  averageTimeSpent: number;
  recentAttempts: QuizAttempt[];
}

export const Statistics: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await quizStorage.init();

      const data = await quizStorage.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
        <Button onClick={loadStats} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!stats || stats.totalAttempts === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 8, borderRadius: 3 }}>
        <CardContent>
          <AssessmentIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No statistics yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete your first quiz to see your performance statistics!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const averagePercentage = parseFloat(stats.averagePercentage);
  const getPerformanceColor = () => {
    if (averagePercentage >= 80) return '#4caf50';
    if (averagePercentage >= 60) return '#ff9800';
    return '#f44336';
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AssessmentIcon sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Your Statistics
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmojiEventsIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Total Attempts
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {stats.totalAttempts}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderRadius: 3, background: `linear-gradient(135deg, ${getPerformanceColor()} 0%, ${getPerformanceColor()}dd 100%)` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Average Score
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {stats.averagePercentage}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {stats.averageScore} avg correct
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Avg Time
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                {formatTime(stats.averageTimeSpent)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Best Streak
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {stats.totalAttempts}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                quizzes taken
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Performance Overview */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Performance Overview
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Average Performance
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {stats.averagePercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseFloat(stats.averagePercentage)}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getPerformanceColor(),
                  borderRadius: 5,
                },
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {averagePercentage >= 80 && "Excellent work! You're mastering the material. Keep it up!"}
            {averagePercentage >= 60 && averagePercentage < 80 && "Good progress! Review difficult topics to improve further."}
            {averagePercentage < 60 && "Keep practicing! Focus on understanding concepts before retaking quizzes."}
          </Typography>
        </CardContent>
      </Card>

      {/* Recent Attempts */}
      {stats.recentAttempts && stats.recentAttempts.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Attempts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {stats.recentAttempts.slice(0, 5).map((attempt, index) => (
                <ListItem
                  key={attempt.id}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'transparent',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Score: {attempt.score} / {attempt.totalQuestions}
                        </Typography>
                        <Chip
                          label={`${attempt.percentageScore}%`}
                          size="small"
                          sx={{
                            backgroundColor:
                              parseFloat(attempt.percentageScore) >= 80
                                ? '#4caf50'
                                : parseFloat(attempt.percentageScore) >= 60
                                ? '#ff9800'
                                : '#f44336',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(attempt.completedAt).toLocaleString()}
                        </Typography>
                        {attempt.timeSpent && (
                          <Typography variant="caption" color="text.secondary">
                            Time: {formatTime(attempt.timeSpent)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
