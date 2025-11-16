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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  setQuestions,
  selectAnswer,
  submitQuiz,
  practiceWrongAnswers,
} from './features/quiz/quizSlice';
import {
  useGenerateQuizMutation,
  QuizQuestion,
} from './features/api/apiSlice';
import { RootState } from './app/store';
import { ApiKeySetup } from './components/ApiKeySetup';
import { ThemeToggle } from './components/ThemeToggle';
import { QuizLoadingSkeleton } from './components/QuizLoadingSkeleton';
import { ScreenReaderAnnouncer } from './components/ScreenReaderAnnouncer';
import { SwipeableCard } from './components/SwipeableCard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuizHistory } from './components/QuizHistory';
import { Statistics } from './components/Statistics';
import { quizStorage, StoredQuiz } from './utils/quizStorage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`quiz-tabpanel-${index}`}
      aria-labelledby={`quiz-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { questions, selectedAnswers, score, submitted, wrongAnswers } = useSelector(
    (state: RootState) => state.quiz
  );

  const [tabValue, setTabValue] = useState(0);
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
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { width, height } = useWindowSize();
  const [generateQuiz, { data: quizData, isLoading, error }] = useGenerateQuizMutation();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quizData) {
      dispatch(setQuestions(quizData));
      setAnnouncement(`Quiz generated successfully with ${quizData.length} questions. Use arrow keys to navigate between questions.`);
      setQuizStartTime(Date.now());
      setCurrentQuizId(null); // Reset quiz ID for new quiz
    }
  }, [quizData, dispatch]);

  useEffect(() => {
    if (submitted && currentQuizId && quizStartTime && score !== null) {
      // Save attempt to IndexedDB
      const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);

      quizStorage.saveAttempt(currentQuizId, {
        answers: selectedAnswers,
        score,
        totalQuestions: questions.length,
        timeSpent,
      }).catch((err) => {
        console.error('Failed to save attempt:', err);
      });
    }
  }, [submitted, currentQuizId, quizStartTime, selectedAnswers, score, questions.length]);

  useEffect(() => {
    if (submitted) {
      const percentage = getScorePercentage();
      const message = `Quiz submitted. You scored ${score} out of ${questions.length}, which is ${percentage} percent. ${
        percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good effort!' : 'Keep practicing!'
      }`;
      setAnnouncement(message);

      if (percentage >= 80) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, score, questions.length]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
    if (!apiKey) {
      setSnackbarMessage('Please set up your API key first. Click the Settings button or refresh the page.');
      setSnackbarOpen(true);
      return;
    }
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
    setQuizStartTime(Date.now()); // Reset timer for practice
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
    setQuizStartTime(null);
    setCurrentQuizId(null);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('provider');
    setApiKey(null);
    setSettingsOpen(false);
  };

  const handleSaveQuiz = () => {
    if (questions.length === 0) return;
    const defaultTitle = `Quiz - ${new Date().toLocaleDateString()}`;
    setQuizTitle(defaultTitle);
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async () => {
    try {
      setIsSaving(true);
      const result = await quizStorage.saveQuiz({
        title: quizTitle,
        difficulty,
        provider,
        questions: questions as QuizQuestion[],
        questionsCount: questions.length,
      });

      setCurrentQuizId(result.id);
      setSaveDialogOpen(false);
      setSnackbarMessage('Quiz saved successfully!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to save quiz:', err);
      setSnackbarMessage('Failed to save quiz. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadQuiz = (quiz: StoredQuiz) => {
    if (quiz.questions) {
      dispatch(setQuestions(quiz.questions));
      setCurrentQuizId(quiz.id);
      setQuizStartTime(Date.now());
      setDifficulty(quiz.difficulty);
      setProvider(quiz.provider);
      setTabValue(0); // Switch to generate tab
      setAnnouncement(`Loaded quiz: ${quiz.title}`);
    }
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => setSettingsOpen(true)}
                  sx={{ height: 'fit-content' }}
                >
                  Settings
                </Button>
                <ThemeToggle />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Navigation Tabs */}
            <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
              <Tab icon={<QuizIcon />} label="Generate Quiz" />
              <Tab icon={<HistoryIcon />} label="History" />
              <Tab icon={<AssessmentIcon />} label="Statistics" />
            </Tabs>

            {/* Generate Quiz Tab */}
            <TabPanel value={tabValue} index={0}>
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
                    max: 20,
                    'aria-label': 'Number of questions to generate',
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleGenerateQuiz}
                  disabled={isLoading || !inputText || !apiKey}
                  size="large"
                  aria-label={isLoading ? 'Generating quiz, please wait' : 'Generate quiz from study material'}
                  sx={{
                    px: 4,
                    py: 1.5,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                    }
                  }}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Generate Quiz'}
                </Button>
                {questions.length > 0 && !submitted && (
                  <Button
                    variant="outlined"
                    onClick={handleSaveQuiz}
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={isSaving}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {isSaving ? 'Saving...' : 'Save Quiz'}
                  </Button>
                )}
                {questions.length > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handleStartOver}
                    size="large"
                    startIcon={<RefreshIcon />}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Start Over
                  </Button>
                )}
              </Box>

              {!apiKey && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please set up your API key to generate quizzes. Click the Settings button in the top-right corner or refresh the page to enter your API key.
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(error as any)?.data?.error || 'An error occurred while generating the quiz. Please try again.'}
                </Alert>
              )}
            </TabPanel>

            {/* Quiz History Tab */}
            <TabPanel value={tabValue} index={1}>
              <QuizHistory onLoadQuiz={handleLoadQuiz} />
            </TabPanel>

            {/* Statistics Tab */}
            <TabPanel value={tabValue} index={2}>
              <Statistics />
            </TabPanel>
          </Paper>
        </motion.div>

        {/* Quiz Questions Display */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuizLoadingSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {questions.length > 0 && !isLoading && tabValue === 0 && (
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
                    <Card sx={{ mb: 3, borderRadius: 3, background: getScoreColor(), color: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmojiEventsIcon sx={{ fontSize: 40 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                              Quiz Complete!
                            </Typography>
                          </Box>
                          <Chip
                            label={`${getScorePercentage()}%`}
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
                        <Typography variant="h5" sx={{ mb: 1 }}>
                          Score: {score ?? 0} / {questions.length}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getScorePercentage()}
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
                      <Card sx={{ mb: 3, borderRadius: 3 }} elevation={2}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <Chip
                              label={`Q${index + 1}`}
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            />
                            {submitted && isCorrect && (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Correct"
                                color="success"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                            {submitted && isWrong && (
                              <Chip
                                icon={<CancelIcon />}
                                label="Incorrect"
                                color="error"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{ mb: 2, fontWeight: 500 }}
                            id={`question-${index}-title`}
                            tabIndex={0}
                            onKeyDown={(e) => handleQuestionNavigation(e, index)}
                          >
                            {q.question}
                          </Typography>
                          <FormControl component="fieldset" fullWidth>
                            <RadioGroup
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

      {/* Save Quiz Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Quiz</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Quiz Title"
            fullWidth
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfirm} variant="contained" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Current Provider:</strong> {provider === 'anthropic' ? 'Anthropic Claude' : 'OpenAI'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              API key is stored locally in your browser
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Clearing your API key will return you to the setup screen.
            </Alert>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={handleClearApiKey}
            >
              Clear API Key & Change Provider
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

export default App;
