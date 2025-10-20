import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
} from '@mui/material';
import {
  setQuestions,
  selectAnswer,
  submitQuiz,
  practiceWrongAnswers,
} from './features/quiz/quizSlice';
import { useGenerateQuizMutation } from './features/api/apiSlice';
import { RootState } from './app/store';

function App() {
  const dispatch = useDispatch();
  const { questions, selectedAnswers, score, submitted, wrongAnswers } = useSelector(
    (state: RootState) => state.quiz
  );

  const [inputText, setInputText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);

  const [generateQuiz, { data: quizData, isLoading, error }] = useGenerateQuizMutation();

  useEffect(() => {
    if (quizData) {
      dispatch(setQuestions(quizData));
    }
  }, [quizData, dispatch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleNumQuestionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumQuestions(parseInt(event.target.value, 10));
  };

  const handleGenerateQuiz = () => {
    generateQuiz({ inputText, numQuestions });
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

  const getOptionStyle = (option: string, questionIndex: number) => {
    if (!submitted) {
      return {};
    }
    const question = questions[questionIndex];
    const isCorrect = option === question.answer;
    const isSelected = selectedAnswers[questionIndex] === option;

    if (isCorrect) {
      return { color: 'green' };
    }
    if (isSelected && !isCorrect) {
      return { color: 'red' };
    }
    return {};
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Study App
        </Typography>
        <TextField
          label="Enter your study material (links, notes, etc.)"
          multiline
          rows={4}
          variant="outlined"
          fullWidth
          value={inputText}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Number of Questions"
          type="number"
          value={numQuestions}
          onChange={handleNumQuestionsChange}
          sx={{ mb: 2, width: '200px' }}
        />
        <Button variant="contained" onClick={handleGenerateQuiz} disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Generate Quiz'}
        </Button>

        {error && <Alert severity="error" sx={{ mt: 2 }}>An error occurred while generating the quiz. Please try again.</Alert>}

        {questions.length > 0 && (
          <Box sx={{ mt: 4 }}>
            {questions.map((q, index) => (
              <FormControl component="fieldset" key={index} sx={{ mb: 2 }}>
                <Typography variant="h6">{q.question}</Typography>
                <RadioGroup
                  aria-label={q.question}
                  name={`quiz-question-${index}`}
                  value={selectedAnswers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                >
                  {q.options.map((option, i) => (
                    <FormControlLabel
                      key={i}
                      value={option}
                      control={<Radio sx={getOptionStyle(option, index)} />}
                      label={option}
                      sx={getOptionStyle(option, index)}
                      disabled={submitted}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            ))}
            {!submitted && (
                <Button variant="contained" color="secondary" onClick={handleSubmitQuiz}>
                Submit Quiz
                </Button>
            )}
            {submitted && (
              <Box>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Your score: {score} / {questions.length}
                </Typography>
                {wrongAnswers.length > 0 && (
                  <Button variant="contained" onClick={handlePracticeWrongAnswers} sx={{ mt: 2 }}>
                    Practice Wrong Answers
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;
