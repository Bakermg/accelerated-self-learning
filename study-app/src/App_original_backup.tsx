import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  FormLabel,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import {
  setQuestions,
  selectAnswer,
  submitQuiz,
  practiceWrongAnswers,
} from './features/quiz/quizSlice';
import { useGenerateQuizMutation } from './features/api/apiSlice';
import { RootState } from './app/store';
import { ApiKeySetup } from './components/ApiKeySetup';
import { ThemeToggle } from './components/ThemeToggle';
import { QuizLoadingSkeleton } from './components/QuizLoadingSkeleton';
import { ScreenReaderAnnouncer } from './components/ScreenReaderAnnouncer';
import { SwipeableCard } from './components/SwipeableCard';
import { MobileBottomNav } from './components/MobileBottomNav';

function App() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { questions, selectedAnswers, score, submitted, wrongAnswers } = useSelector(
    (state: RootState) => state.quiz
  );

  const [inputText, setInputText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate');
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('apiKey'));
  const [provider, setProvider] = useState<'anthropic' | 'openai'>(
    (localStorage.getItem('provider') as 'anthropic' | 'openai') || 'anthropic'
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { width, height } = useWindowSize();
  const [generateQuiz, { data: quizData, isLoading, error }] = useGenerateQuizMutation();

  useEffect(() => {
    if (quizData) {
      dispatch(setQuestions(quizData));
      setAnnouncement(`Quiz generated successfully with ${quizData.length} questions. Use arrow keys to navigate between questions.`);
    }
  }, [quizData, dispatch]);

  useEffect(() => {
    if (submitted) {
      const percentage = getScorePercentage();
      const message = `Quiz submitted. You scored ${score} out of ${questions.length}, which is ${percentage} percent. ${
        percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good effort!' : 'Keep practicing!'
      }`;
      setAnnouncement(message);

      if (percentage >= 80) {
        setShowConfetti(true);
        // Stop confetti after 5 seconds
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, score, questions.length]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleNumQuestionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumQuestions(parseInt(event.target.value, 10));
  };

  const handleApiKeySubmit = (key: string, providerType: 'anthropic' | 'openai') => {
    localStorage.setItem('apiKey', key);
    localStorage.setItem('provider', providerType);
    setApiKey(key);
    setProvider(providerType);
  };

  const handleGenerateQuiz = () => {
    if (!apiKey) return;
    generateQuiz({ inputText, numQuestions, difficulty, apiKey, provider });
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    dispatch(selectAnswer({ questionIndex, answer }));
  };

  const handleSubmitQuiz = () => {
    dispatch(submitQuiz());
  };

  const handlePracticeWrongAnswers = () => {
    dispatch(practiceWrongAnswers());
  };

  const handleDifficultyChange = (
    _event: React.MouseEvent<HTMLElement>,
    newDifficulty: 'easy' | 'moderate' | 'hard' | null,
  ) => {
    if (newDifficulty !== null) {
      setDifficulty(newDifficulty);
    }
  };

  const handleStartOver = () => {
    setInputText('');
    setNumQuestions(5);
    setDifficulty('moderate');
    dispatch(setQuestions([]));
  };

  const handleQuestionNavigation = (event: React.KeyboardEvent, currentIndex: number) => {
    const totalQuestions = questions.length;
    let targetIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        targetIndex = (currentIndex + 1) % totalQuestions;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        targetIndex = (currentIndex - 1 + totalQuestions) % totalQuestions;
        break;
      default:
        return;
    }

    scrollToQuestion(targetIndex);
  };

  const scrollToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const targetElement = document.getElementById(`question-${index}-title`);
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleMobileNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      scrollToQuestion(currentQuestionIndex + 1);
    }
  };

  const handleMobilePrevious = () => {
    if (currentQuestionIndex > 0) {
      scrollToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSwipeLeft = (currentIndex: number) => {
    const nextIndex = Math.min(currentIndex + 1, questions.length - 1);
    if (nextIndex !== currentIndex) {
      scrollToQuestion(nextIndex);
      setAnnouncement(`Navigated to question ${nextIndex + 1} of ${questions.length}`);
    }
  };

  const handleSwipeRight = (currentIndex: number) => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      scrollToQuestion(prevIndex);
      setAnnouncement(`Navigated to question ${prevIndex + 1} of ${questions.length}`);
    }
  };

  const getOptionStyle = (option: string, questionIndex: number) => {
    if (!submitted) {
      return {};
    }
    const question = questions[questionIndex];
    const isCorrect = option === question.answer;
    const isSelected = selectedAnswers[questionIndex] === option;

    if (isCorrect) {
      return {
        backgroundColor: theme.palette.success.light,
        borderLeft: `4px solid ${theme.palette.success.main}`,
        padding: '8px',
        borderRadius: '4px',
        fontWeight: 600,
      };
    }
    if (isSelected && !isCorrect) {
      return {
        backgroundColor: theme.palette.error.light,
        borderLeft: `4px solid ${theme.palette.error.main}`,
        padding: '8px',
        borderRadius: '4px',
      };
    }
    return {};
  };

  const getScorePercentage = () => {
    if (questions.length === 0 || score === null) return 0;
    return Math.round((score / questions.length) * 100);
  };

  const getScoreColor = () => {
    const percentage = getScorePercentage();
    if (percentage >= 80) return theme.palette.success.main;
    if (percentage >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Show API key setup if no key is stored
  if (!apiKey) {
    return <ApiKeySetup onKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.palette.mode === 'light'
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      py: 4
    }}>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      <ScreenReaderAnnouncer message={announcement} />
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <ThemeToggle />
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <QuizIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 1 }} />
              </motion.div>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                AI Study Quiz Generator
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Generate quizzes from any text or web link
              </Typography>
            </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Difficulty Level
            </FormLabel>
            <ToggleButtonGroup
              value={difficulty}
              exclusive
              onChange={handleDifficultyChange}
              aria-label="difficulty level"
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="easy" aria-label="easy difficulty" sx={{ py: 1.5 }}>
                <Box>
                  <Typography variant="button" sx={{ fontWeight: 600 }}>Easy</Typography>
                  <Typography variant="caption" display="block" sx={{ textTransform: 'none' }}>
                    Simple concepts
                  </Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="moderate" aria-label="moderate difficulty" sx={{ py: 1.5 }}>
                <Box>
                  <Typography variant="button" sx={{ fontWeight: 600 }}>Moderate</Typography>
                  <Typography variant="caption" display="block" sx={{ textTransform: 'none' }}>
                    Balanced challenge
                  </Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="hard" aria-label="hard difficulty" sx={{ py: 1.5 }}>
                <Box>
                  <Typography variant="button" sx={{ fontWeight: 600 }}>Hard</Typography>
                  <Typography variant="caption" display="block" sx={{ textTransform: 'none' }}>
                    Advanced topics
                  </Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            label="Enter your study material (links, notes, etc.)"
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            value={inputText}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            placeholder="Paste a URL or enter text to generate quiz questions..."
            aria-label="Study material input"
            aria-describedby="study-material-helper-text"
            inputProps={{
              'aria-required': true,
              'aria-label': 'Study material input field'
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Number of Questions"
              type="number"
              value={numQuestions}
              onChange={handleNumQuestionsChange}
              sx={{ width: '200px' }}
              inputProps={{
                min: 1,
                max: 10,
                'aria-label': 'Number of questions to generate',
                'aria-valuemin': 1,
                'aria-valuemax': 10,
                'aria-valuenow': numQuestions
              }}
            />
            <Button
              variant="contained"
              onClick={handleGenerateQuiz}
              disabled={isLoading || !inputText}
              size="large"
              aria-label={isLoading ? 'Generating quiz, please wait' : 'Generate quiz from study material'}
              aria-busy={isLoading}
              sx={{
                px: 4,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} aria-label="Loading" /> : 'Generate Quiz'}
            </Button>
            {questions.length > 0 && (
              <Button
                variant="outlined"
                onClick={handleStartOver}
                size="large"
                startIcon={<RefreshIcon />}
                color="primary"
                aria-label="Start over with a new quiz"
                sx={{
                  px: 4,
                  py: 1.5,
                }}
              >
                Start Over
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(error as any)?.data?.error || 'An error occurred while generating the quiz. Please try again.'}
            </Alert>
          )}
          </Paper>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <QuizLoadingSkeleton />
            </motion.div>
          )}</AnimatePresence>

        {questions.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ pb: { xs: 10, md: 0 } }}>
              <AnimatePresence>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <Card sx={{ mb: 3, borderRadius: 3, background: getScoreColor(), color: 'white' }} role="region" aria-label="Quiz results">
                      <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEventsIcon sx={{ fontSize: 40 }} aria-hidden="true" />
                      <Typography variant="h4" sx={{ fontWeight: 700 }} role="status" aria-live="polite">
                        Quiz Complete!
                      </Typography>
                    </Box>
                    <Chip
                      label={`${getScorePercentage()}%`}
                      aria-label={`Score percentage: ${getScorePercentage()} percent`}
                      sx={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        px: 2,
                        py: 3,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        color: 'white'
                      }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ mb: 1 }} aria-live="polite">
                    Score: {score ?? 0} / {questions.length}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getScorePercentage()}
                    aria-label={`Quiz score progress: ${getScorePercentage()} percent`}
                    aria-valuenow={getScorePercentage()}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                  {wrongAnswers.length > 0 && (
                    <Button
                      variant="contained"
                      onClick={handlePracticeWrongAnswers}
                      sx={{ mt: 2, backgroundColor: 'white', color: getScoreColor(), '&:hover': { backgroundColor: '#f5f5f5' } }}
                      startIcon={<RestartAltIcon />}
                      aria-label={`Practice ${wrongAnswers.length} wrong answer${wrongAnswers.length > 1 ? 's' : ''}`}
                    >
                      Practice Wrong Answers
                    </Button>
                  )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

            {questions.map((q, index) => {
              const question = questions[index];
              const isCorrect = submitted && selectedAnswers[index] === question.answer;
              const isWrong = submitted && selectedAnswers[index] && selectedAnswers[index] !== question.answer;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <SwipeableCard
                    onSwipeLeft={() => handleSwipeLeft(index)}
                    onSwipeRight={() => handleSwipeRight(index)}
                  >
                    <Card sx={{ mb: 3, borderRadius: 3 }} elevation={2} role="region" aria-labelledby={`question-${index}-title`}>
                    <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Chip
                        label={`Q${index + 1}`}
                        color="primary"
                        sx={{ fontWeight: 600 }}
                        aria-label={`Question ${index + 1}`}
                      />
                      {submitted && isCorrect && (
                        <Chip
                          icon={<CheckCircleIcon aria-hidden="true" />}
                          label="Correct"
                          color="success"
                          sx={{ fontWeight: 600 }}
                          aria-label="Answer is correct"
                          role="status"
                        />
                      )}
                      {submitted && isWrong && (
                        <Chip
                          icon={<CancelIcon aria-hidden="true" />}
                          label="Incorrect"
                          color="error"
                          sx={{ fontWeight: 600 }}
                          aria-label="Answer is incorrect"
                          role="status"
                        />
                      )}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 500, outline: 'none', '&:focus': { outline: '2px solid', outlineColor: theme.palette.primary.main, outlineOffset: '4px', borderRadius: 1 } }}
                      id={`question-${index}-title`}
                      tabIndex={0}
                      onKeyDown={(e) => handleQuestionNavigation(e, index)}
                    >
                      {q.question}
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        aria-label={q.question}
                        name={`quiz-question-${index}`}
                        value={selectedAnswers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                      >
                        {q.options.map((option, i) => {
                          const isCorrectOption = option === question.answer;
                          const isSelectedOption = selectedAnswers[index] === option;

                          return (
                            <Box key={i} sx={{ mb: 1 }}>
                              <FormControlLabel
                                value={option}
                                control={
                                  <Radio
                                    icon={
                                      submitted && isCorrectOption ?
                                        <CheckCircleIcon sx={{ color: '#4caf50' }} /> :
                                        undefined
                                    }
                                    checkedIcon={
                                      submitted && isCorrectOption ?
                                        <CheckCircleIcon sx={{ color: '#4caf50' }} /> :
                                        submitted && isSelectedOption && !isCorrectOption ?
                                          <CancelIcon sx={{ color: '#f44336' }} /> :
                                          undefined
                                    }
                                  />
                                }
                                label={option}
                                sx={{
                                  width: '100%',
                                  m: 0,
                                  ...getOptionStyle(option, index),
                                  transition: 'all 0.2s',
                                  '&:hover': !submitted ? { backgroundColor: theme.palette.action.hover } : {},
                                }}
                                disabled={submitted}
                              />
                            </Box>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>

                    {submitted && isWrong && (
                      <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.warning.light, borderRadius: 2, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                          <InfoIcon sx={{ color: theme.palette.warning.main, fontSize: 20, mt: 0.3 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.warning.dark }}>
                            Why this is incorrect:
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {q.explanation}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          startIcon={<SearchIcon />}
                          href={`https://www.google.com/search?q=${encodeURIComponent(q.question)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Learn More
                        </Button>
                      </Box>
                    )}
                    </CardContent>
                    </Card>
                  </SwipeableCard>
                </motion.div>
              );
            })}

            {!submitted && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSubmitQuiz}
                  size="large"
                  disabled={Object.keys(selectedAnswers).length === 0}
                  aria-label={`Submit quiz with ${Object.keys(selectedAnswers).length} of ${questions.length} questions answered`}
                  aria-disabled={Object.keys(selectedAnswers).length === 0}
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3
                  }}
                >
                  Submit Quiz
                </Button>
              </Box>
            )}
            </Box>
          </motion.div>
        )}

        <MobileBottomNav
          currentQuestion={currentQuestionIndex}
          totalQuestions={questions.length}
          onPrevious={handleMobilePrevious}
          onNext={handleMobileNext}
          onSubmit={handleSubmitQuiz}
          canSubmit={Object.keys(selectedAnswers).length > 0}
          submitted={submitted}
        />
      </Container>
    </Box>
  );
}

export default App;
