const Joi = require('joi');
const { AppError } = require('../middleware/errorHandler');

// Validation schema for quiz generation request
const quizGenerationSchema = Joi.object({
  inputText: Joi.string()
    .min(10)
    .max(50000)
    .required()
    .trim()
    .messages({
      'string.empty': 'Input text is required',
      'string.min': 'Input text must be at least 10 characters',
      'string.max': 'Input text must not exceed 50,000 characters',
      'any.required': 'Input text is required',
    }),

  numQuestions: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      'number.base': 'Number of questions must be a number',
      'number.min': 'Number of questions must be at least 1',
      'number.max': 'Number of questions must not exceed 20',
      'any.required': 'Number of questions is required',
    }),

  difficulty: Joi.string()
    .valid('easy', 'moderate', 'hard')
    .required()
    .messages({
      'any.only': 'Difficulty must be either easy, moderate, or hard',
      'any.required': 'Difficulty level is required',
    }),

  apiKey: Joi.string()
    .required()
    .trim()
    .messages({
      'string.empty': 'API key is required',
      'any.required': 'API key is required',
    }),

  provider: Joi.string()
    .valid('anthropic', 'openai')
    .required()
    .messages({
      'any.only': 'Provider must be either anthropic or openai',
      'any.required': 'Provider is required',
    }),
});

// Middleware to validate quiz generation request
const validateQuizGeneration = (req, res, next) => {
  const { error, value } = quizGenerationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(', ');
    return next(new AppError(errorMessage, 400));
  }

  // Replace req.body with validated and sanitized data
  req.body = value;
  next();
};

module.exports = {
  validateQuizGeneration,
};
