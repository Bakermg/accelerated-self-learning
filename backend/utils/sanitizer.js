const validator = require('validator');

/**
 * Sanitize text input to prevent XSS attacks
 * @param {string} input - Input text to sanitize
 * @returns {string} Sanitized text
 */
const sanitizeText = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags and escape special characters
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Sanitize URL input
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Validate URL format
  if (!validator.isURL(trimmedUrl, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  })) {
    return null;
  }

  // Check for dangerous protocols
  if (trimmedUrl.match(/^(javascript|data|vbscript|file):/i)) {
    return null;
  }

  return trimmedUrl;
};

/**
 * Sanitize scraped content from web pages
 * @param {string} content - Content to sanitize
 * @returns {string} Sanitized content
 */
const sanitizeScrapedContent = (content) => {
  if (typeof content !== 'string') {
    return '';
  }

  // Remove multiple spaces and normalize whitespace
  let sanitized = content
    .replace(/\s\s+/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();

  // Remove any remaining HTML entities that might be dangerous
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  return sanitized;
};

/**
 * Sanitize AI-generated quiz data
 * @param {Array} quizData - Quiz data array to sanitize
 * @returns {Array} Sanitized quiz data
 */
const sanitizeQuizData = (quizData) => {
  if (!Array.isArray(quizData)) {
    return [];
  }

  return quizData.map((question) => ({
    question: sanitizeText(question.question || ''),
    options: Array.isArray(question.options)
      ? question.options.map((opt) => sanitizeText(opt))
      : [],
    answer: sanitizeText(question.answer || ''),
    explanation: sanitizeText(question.explanation || ''),
  }));
};

module.exports = {
  sanitizeText,
  sanitizeUrl,
  sanitizeScrapedContent,
  sanitizeQuizData,
};
