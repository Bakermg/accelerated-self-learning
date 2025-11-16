import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface GenerateQuizRequest {
  inputText: string;
  numQuestions: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  apiKey: string;
  provider: 'anthropic' | 'openai';
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5001' }),
  endpoints: (builder) => ({
    // Generate quiz using AI
    generateQuiz: builder.mutation<QuizQuestion[], GenerateQuizRequest>({
      query: (body) => ({
        url: '/generate-quiz',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGenerateQuizMutation,
} = apiSlice;
