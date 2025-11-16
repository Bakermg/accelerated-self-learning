const express = require('express');
const { Quiz, QuizAttempt } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validateQuizGeneration } = require('../validators/quizValidator');
const { quizGenerationLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');
const { sanitizeQuizData } = require('../utils/sanitizer');

const router = express.Router();

// Save a new quiz (after generation)
router.post(
  '/save',
  asyncHandler(async (req, res) => {
    const {
      questions,
      sourceText,
      sourceUrl,
      difficulty,
      provider,
      title,
      tags,
      sessionId,
    } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Questions are required', 400);
    }

    if (!difficulty || !['easy', 'moderate', 'hard'].includes(difficulty)) {
      throw new AppError('Valid difficulty level is required', 400);
    }

    if (!provider || !['anthropic', 'openai'].includes(provider)) {
      throw new AppError('Valid provider is required', 400);
    }

    // Sanitize quiz data
    const sanitizedQuestions = sanitizeQuizData(questions);

    const quiz = await Quiz.create({
      userId: req.userId || null, // If auth is implemented
      title: title || `Quiz - ${new Date().toLocaleDateString()}`,
      sourceText: sourceText || null,
      sourceUrl: sourceUrl || null,
      difficulty,
      provider,
      questions: sanitizedQuestions,
      questionsCount: sanitizedQuestions.length,
      tags: tags || [],
    });

    logger.info('Quiz saved successfully', { quizId: quiz.id });

    res.status(201).json({
      message: 'Quiz saved successfully',
      quiz: {
        id: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        questionsCount: quiz.questionsCount,
        createdAt: quiz.createdAt,
      },
    });
  })
);

// Get all quizzes (with pagination)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const difficulty = req.query.difficulty;
    const sessionId = req.query.sessionId;

    const where = {};

    // Filter by difficulty if provided
    if (difficulty && ['easy', 'moderate', 'hard'].includes(difficulty)) {
      where.difficulty = difficulty;
    }

    // For anonymous users, we can't filter by userId
    // You can implement session-based filtering if needed

    const { count, rows: quizzes } = await Quiz.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'title',
        'difficulty',
        'questionsCount',
        'provider',
        'tags',
        'createdAt',
      ],
    });

    res.json({
      quizzes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalQuizzes: count,
        perPage: limit,
      },
    });
  })
);

// Get a specific quiz by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: QuizAttempt,
          as: 'attempts',
          attributes: ['id', 'score', 'totalQuestions', 'percentageScore', 'completedAt'],
          order: [['completedAt', 'DESC']],
          limit: 5,
        },
      ],
    });

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    res.json(quiz);
  })
);

// Delete a quiz
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quiz = await Quiz.findByPk(id);

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    await quiz.destroy();

    logger.info('Quiz deleted successfully', { quizId: id });

    res.json({
      message: 'Quiz deleted successfully',
    });
  })
);

// Submit a quiz attempt
router.post(
  '/:id/attempts',
  asyncHandler(async (req, res) => {
    const { id: quizId } = req.params;
    const { answers, timeSpent, sessionId } = req.body;

    if (!answers || typeof answers !== 'object') {
      throw new AppError('Answers are required', 400);
    }

    const quiz = await Quiz.findByPk(quizId);

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    // Calculate score
    const questions = quiz.questions;
    let score = 0;
    const wrongAnswers = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      if (userAnswer === question.answer) {
        score++;
      } else if (userAnswer) {
        wrongAnswers.push(index);
      }
    });

    const totalQuestions = questions.length;
    const percentageScore = (score / totalQuestions) * 100;

    // Save attempt
    const attempt = await QuizAttempt.create({
      quizId,
      userId: req.userId || null,
      sessionId: sessionId || null,
      answers,
      score,
      totalQuestions,
      percentageScore,
      timeSpent: timeSpent || null,
      wrongAnswers,
      completedAt: new Date(),
    });

    logger.info('Quiz attempt saved', {
      quizId,
      attemptId: attempt.id,
      score,
      totalQuestions,
    });

    res.status(201).json({
      message: 'Quiz attempt saved successfully',
      attempt: {
        id: attempt.id,
        score,
        totalQuestions,
        percentageScore: percentageScore.toFixed(2),
        wrongAnswers,
        completedAt: attempt.completedAt,
      },
    });
  })
);

// Get quiz attempts for a specific quiz
router.get(
  '/:id/attempts',
  asyncHandler(async (req, res) => {
    const { id: quizId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const quiz = await Quiz.findByPk(quizId);

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const { count, rows: attempts } = await QuizAttempt.findAndCountAll({
      where: { quizId },
      limit,
      offset,
      order: [['completedAt', 'DESC']],
      attributes: [
        'id',
        'score',
        'totalQuestions',
        'percentageScore',
        'timeSpent',
        'completedAt',
      ],
    });

    res.json({
      attempts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalAttempts: count,
        perPage: limit,
      },
    });
  })
);

// Get statistics for all attempts (global or per user)
router.get(
  '/stats/overview',
  asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId;

    const where = {};
    if (sessionId) {
      where.sessionId = sessionId;
    }

    const attempts = await QuizAttempt.findAll({
      where,
      attributes: [
        'score',
        'totalQuestions',
        'percentageScore',
        'timeSpent',
        'completedAt',
      ],
      order: [['completedAt', 'DESC']],
      limit: 100,
    });

    if (attempts.length === 0) {
      return res.json({
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        averageTimeSpent: 0,
        recentAttempts: [],
      });
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, att) => sum + att.score, 0);
    const totalPercentage = attempts.reduce((sum, att) => sum + att.percentageScore, 0);
    const totalTime = attempts.reduce((sum, att) => sum + (att.timeSpent || 0), 0);

    res.json({
      totalAttempts,
      averageScore: (totalScore / totalAttempts).toFixed(2),
      averagePercentage: (totalPercentage / totalAttempts).toFixed(2),
      averageTimeSpent: Math.round(totalTime / totalAttempts),
      recentAttempts: attempts.slice(0, 10),
    });
  })
);

module.exports = router;
