const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const hpp = require('hpp');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const puppeteer = require('puppeteer');

// Import configuration and utilities
const config = require('./config/config');
const { requestLogger, logger } = require('./utils/logger');
const {
  sanitizeText,
  sanitizeUrl,
  sanitizeScrapedContent,
  sanitizeQuizData,
} = require('./utils/sanitizer');

// Import database
const { testConnection } = require('./config/database');

// Import middleware
const { apiLimiter, quizGenerationLimiter } = require('./middleware/rateLimiter');
const {
  AppError,
  errorHandler,
  asyncHandler,
  notFound,
} = require('./middleware/errorHandler');
const { validateQuizGeneration } = require('./validators/quizValidator');

// Import routes
const quizRoutes = require('./routes/quizRoutes');

const app = express();

// Trust proxy (for rate limiting behind reverse proxies)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// Security Headers - Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parser middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression middleware
app.use(compression());

// HTTP Parameter Pollution protection
app.use(hpp());

// Request logging
app.use(requestLogger);

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Study Quiz API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      generateQuiz: 'POST /generate-quiz',
      quizzes: '/api/quizzes',
    },
  });
});

// Mount quiz routes
app.use('/api/quizzes', quizRoutes);

// Helper function to check if string is a URL
const isUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Web scraping function with security improvements
async function scrapeContent(url) {
  let browser;
  try {
    // Validate and sanitize URL
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      throw new AppError('Invalid URL provided', 400);
    }

    logger.info('Starting web scraping', { url: sanitizedUrl });

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to URL with timeout
    await page.goto(sanitizedUrl, {
      waitUntil: 'networkidle2',
      timeout: config.scrapingTimeout,
    });

    // Extract content
    let content = await page.evaluate(() => {
      const selectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '#content',
        '.post-content',
        '.entry-content',
        'body',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.length > 100) {
          return element.innerText;
        }
      }
      return document.body.innerText;
    });

    await browser.close();

    // Sanitize scraped content
    content = sanitizeScrapedContent(content);

    if (content.length < 50) {
      throw new AppError('Insufficient content extracted from URL', 400);
    }

    logger.info('Successfully scraped content', {
      url: sanitizedUrl,
      length: content.length,
    });

    // Limit content length
    return content.substring(0, config.maxContentLength);
  } catch (error) {
    if (browser) await browser.close();
    logger.error('Error scraping URL', { error: error.message, url });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      `Failed to scrape content from URL: ${error.message}`,
      500
    );
  }
}

// Quiz generation endpoint with validation and rate limiting
app.post(
  '/generate-quiz',
  quizGenerationLimiter,
  validateQuizGeneration,
  asyncHandler(async (req, res) => {
    let { inputText, numQuestions, difficulty, apiKey, provider } = req.body;

    logger.info('Quiz generation request', {
      provider,
      difficulty,
      numQuestions,
      isUrl: isUrl(inputText),
    });

    // Check if input is a URL and scrape if needed
    if (isUrl(inputText)) {
      inputText = await scrapeContent(inputText);
    } else {
      // Sanitize text input
      inputText = sanitizeText(inputText);
    }

    // Ensure we have sufficient content
    if (inputText.length < 10) {
      throw new AppError('Input text is too short to generate a quiz', 400);
    }

    // Define difficulty-specific instructions
    const difficultyInstructions = {
      easy: 'Focus on basic concepts, simple recall questions, and straightforward definitions. Make questions accessible for beginners.',
      moderate:
        'Include a balanced mix of recall and application questions. Questions should require understanding of concepts and their relationships.',
      hard: 'Create challenging questions that require deep understanding, analysis, and synthesis. Include complex scenarios, edge cases, and questions that test advanced comprehension.',
    };

    const difficultyInstruction = difficultyInstructions[difficulty];

    const prompt = `Based on the text below, generate a valid JSON array of ${numQuestions} multiple-choice questions with ${difficulty} difficulty.

Difficulty Guidelines: ${difficultyInstruction}

Each object in the array must have:
- "question": string (the question text)
- "options": array of 4 strings (the answer choices)
- "answer": string (must match one of the options exactly)
- "explanation": string (a brief 1-2 sentence explanation of why this is the correct answer, including key concepts or facts)

IMPORTANT:
- Output ONLY valid JSON with no additional text or formatting
- Use straight double quotes (") not curly quotes
- Properly escape any quotes within strings
- Ensure all strings are properly closed
- Do not include trailing commas

Text: "${inputText}"`;

    let responseText;

    try {
      // Call the appropriate AI provider
      if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey });
        const msg = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: config.maxTokens,
          messages: [{ role: 'user', content: prompt }],
        });
        responseText = msg.content[0].text;
      } else if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful quiz generator assistant. You always respond with valid JSON only, no additional text.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: config.maxTokens,
          temperature: 0.7,
        });
        responseText = completion.choices[0].message.content;
      }
    } catch (apiError) {
      logger.error('AI API error', { error: apiError.message, provider });

      // Handle specific API errors
      if (apiError.status === 401) {
        throw new AppError(
          'Invalid API key. Please check your key and try again.',
          401
        );
      }

      if (apiError.status === 429 || apiError.code === 'insufficient_quota') {
        throw new AppError(
          'API quota exceeded. Please check your plan and billing details.',
          429
        );
      }

      throw new AppError(
        `Failed to generate quiz: ${apiError.message}`,
        500
      );
    }

    // Parse and validate the AI response
    const startIndex = responseText.indexOf('[');
    const endIndex = responseText.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      logger.error('No JSON array found in AI response', { responseText });
      throw new AppError(
        'No quiz data found in AI response. Please try again.',
        500
      );
    }

    let jsonString = responseText.substring(startIndex, endIndex + 1);

    // Clean up common JSON issues
    jsonString = jsonString
      .replace(/[\u201C\u201D]/g, "'") // curly double quotes
      .replace(/[\u2018\u2019]/g, "'") // curly single quotes
      .replace(/[\u201E\u201F\u2033\u2036\u201A\u201B\u2032\u2035]/g, "'") // other quotes
      .replace(/^\uFEFF/, ''); // BOM

    try {
      let quiz = JSON.parse(jsonString);

      // Validate quiz structure
      if (!Array.isArray(quiz)) {
        throw new Error('Quiz data is not an array');
      }

      // Validate each question
      quiz = quiz.filter((q) => {
        return (
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.answer &&
          q.explanation
        );
      });

      if (quiz.length === 0) {
        throw new Error('No valid questions found in quiz data');
      }

      // Sanitize quiz data to prevent XSS
      const sanitizedQuiz = sanitizeQuizData(quiz);

      logger.info('Quiz generated successfully', {
        provider,
        questionsCount: sanitizedQuiz.length,
      });

      res.json(sanitizedQuiz);
    } catch (parseError) {
      logger.error('Failed to parse JSON from AI response', {
        error: parseError.message,
      });

      // Try to fix common JSON errors
      try {
        const fixedJson = jsonString.replace(/,(\s*[}\]])/g, '$1');
        let quiz = JSON.parse(fixedJson);
        const sanitizedQuiz = sanitizeQuizData(quiz);

        if (sanitizedQuiz.length === 0) {
          throw new Error('No valid questions after sanitization');
        }

        res.json(sanitizedQuiz);
      } catch (secondError) {
        logger.error('Second parse attempt failed', {
          error: secondError.message,
        });
        throw new AppError(
          'Failed to parse quiz data from AI response. Please try again.',
          500
        );
      }
    }
  })
);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Initialize database and start server
let server;

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Database connection failed. Server will start but database features will be unavailable.');
    }

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`, {
        environment: config.nodeEnv,
        corsOrigin: config.corsOrigin,
        databaseStatus: dbConnected ? 'connected' : 'disconnected',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
