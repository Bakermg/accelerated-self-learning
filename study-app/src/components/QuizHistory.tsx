import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import FilterListIcon from '@mui/icons-material/FilterList';
import { quizStorage, StoredQuiz } from '../utils/quizStorage';

interface QuizHistoryProps {
  onLoadQuiz: (quiz: StoredQuiz) => void;
}

export const QuizHistory: React.FC<QuizHistoryProps> = ({ onLoadQuiz }) => {
  const [page, setPage] = useState(1);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<StoredQuiz[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 9;

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await quizStorage.init();

      const offset = (page - 1) * itemsPerPage;
      const result = await quizStorage.getQuizzes({
        difficulty: difficultyFilter || undefined,
        limit: itemsPerPage,
        offset,
      });

      setQuizzes(result.quizzes);
      setTotalQuizzes(result.total);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
      setError('Failed to load quiz history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [page, difficultyFilter]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleDifficultyFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    setDifficultyFilter(newFilter);
    setPage(1); // Reset to first page when filtering
  };

  const handleDeleteClick = (quizId: string) => {
    setQuizToDelete(quizId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (quizToDelete) {
      try {
        setIsDeleting(true);
        await quizStorage.deleteQuiz(quizToDelete);
        setDeleteDialogOpen(false);
        setQuizToDelete(null);
        // Reload quizzes
        await loadQuizzes();
      } catch (err) {
        console.error('Failed to delete quiz:', err);
        setError('Failed to delete quiz');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setQuizToDelete(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'moderate':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const totalPages = Math.ceil(totalQuizzes / itemsPerPage);

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
        <Button onClick={loadQuizzes} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <HistoryIcon sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Quiz History
        </Typography>
      </Box>

      {/* Filter Section */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FilterListIcon sx={{ color: '#667eea' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Filter by Difficulty:
        </Typography>
        <ToggleButtonGroup
          value={difficultyFilter}
          exclusive
          onChange={handleDifficultyFilterChange}
          size="small"
        >
          <ToggleButton value="easy">Easy</ToggleButton>
          <ToggleButton value="moderate">Moderate</ToggleButton>
          <ToggleButton value="hard">Hard</ToggleButton>
        </ToggleButtonGroup>
        {difficultyFilter && (
          <Button
            size="small"
            onClick={() => {
              setDifficultyFilter(null);
              setPage(1);
            }}
          >
            Clear Filter
          </Button>
        )}
      </Box>

      {quizzes.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, borderRadius: 3 }}>
          <CardContent>
            <HistoryIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No saved quizzes yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate and save your first quiz to see it here!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {quizzes.map((quiz) => (
              <Box key={quiz.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        label={quiz.difficulty}
                        color={getDifficultyColor(quiz.difficulty)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={quiz.provider}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {quiz.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {quiz.questionsCount} questions
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(quiz.createdAt).toLocaleDateString()}
                    </Typography>

                    {quiz.tags && quiz.tags.length > 0 && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {quiz.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </CardContent>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => onLoadQuiz(quiz)}
                      sx={{
                        flexGrow: 1,
                        mr: 1,
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5568d3 30%, #653a8b 90%)',
                        },
                      }}
                    >
                      Take Quiz
                    </Button>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(quiz.id)}
                      disabled={isDeleting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Quiz?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quiz? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
