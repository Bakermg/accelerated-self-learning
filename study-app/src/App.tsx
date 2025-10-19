import React, { useState } from 'react';
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

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

function App() {
  const [inputText, setInputText] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleNumQuestionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNumQuestions(parseInt(event.target.value, 10));
  };

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setQuiz([]);
    setSelectedAnswers({});
    setScore(null);
    setSubmitted(false);

    try {
      const response = await fetch('http://localhost:5000/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText, numQuestions }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      setQuiz(data);
    } catch (err) {
      setError('An error occurred while generating the quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer,
    });
  };

  const handleSubmitQuiz = () => {
    let correctAnswers = 0;
    quiz.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setSubmitted(true);
  };

  const getOptionStyle = (option: string, questionIndex: number) => {
    if (!submitted) {
      return {};
    }
    const question = quiz[questionIndex];
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
        <Button variant="contained" onClick={generateQuiz} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Generate Quiz'}
        </Button>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {quiz.length > 0 && (
          <Box sx={{ mt: 4 }}>
            {quiz.map((q, index) => (
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
            <Button variant="contained" color="secondary" onClick={handleSubmitQuiz} disabled={submitted}>
              Submit Quiz
            </Button>
            {score !== null && (
              <Typography variant="h6" sx={{ mt: 2 }}>
                Your score: {score} / {quiz.length}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;
