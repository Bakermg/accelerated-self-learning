import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface GenerateQuizRequest {
  inputText: string;
  numQuestions: number;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000' }),
  endpoints: (builder) => ({
    generateQuiz: builder.mutation<QuizQuestion[], GenerateQuizRequest>({
      query: (body) => ({
        url: '/generate-quiz',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateQuizMutation } = apiSlice;
