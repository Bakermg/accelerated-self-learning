import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizState {
  questions: QuizQuestion[];
  selectedAnswers: Record<number, string>;
  score: number | null;
  submitted: boolean;
  wrongAnswers: QuizQuestion[];
}

const initialState: QuizState = {
  questions: [],
  selectedAnswers: {},
  score: null,
  submitted: false,
  wrongAnswers: [],
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setQuestions(state, action: PayloadAction<QuizQuestion[]>) {
      state.questions = action.payload;
      state.selectedAnswers = {};
      state.score = null;
      state.submitted = false;
      state.wrongAnswers = [];
    },
    selectAnswer(state, action: PayloadAction<{ questionIndex: number; answer: string }>) {
      state.selectedAnswers[action.payload.questionIndex] = action.payload.answer;
    },
    submitQuiz(state) {
      let correctAnswers = 0;
      const wrongAnswers: QuizQuestion[] = [];
      state.questions.forEach((q, index) => {
        if (state.selectedAnswers[index] === q.answer) {
          correctAnswers++;
        } else {
          wrongAnswers.push(q);
        }
      });
      state.score = correctAnswers;
      state.submitted = true;
      state.wrongAnswers = wrongAnswers;
    },
    practiceWrongAnswers(state) {
      state.questions = state.wrongAnswers;
      state.selectedAnswers = {};
      state.score = null;
      state.submitted = false;
      state.wrongAnswers = [];
    },
  },
});

export const {
  setQuestions,
  selectAnswer,
  submitQuiz,
  practiceWrongAnswers,
} = quizSlice.actions;

export default quizSlice.reducer;
