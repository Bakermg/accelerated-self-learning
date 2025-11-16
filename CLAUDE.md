# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack study application with comprehensive security features and database persistence:

- **Frontend**: React TypeScript application (`study-app/`) using Material-UI, Redux Toolkit, and RTK Query
- **Backend**: Secure Express.js server (`backend/`) with:
  - Anthropic Claude & OpenAI API integration
  - PostgreSQL database with Sequelize ORM
  - Comprehensive security middleware
  - Quiz history and analytics
  - Puppeteer web scraping

The app generates AI-powered quizzes from study materials (text or URLs), provides interactive practice sessions, and tracks performance over time.

## Development Commands

### Frontend (study-app/)
```bash
cd study-app
npm start        # Development server at http://localhost:3000
npm test         # Run tests in watch mode
npm run build    # Production build
```

### Backend (backend/)
```bash
cd backend
npm run dev          # Development server with nodemon at http://localhost:5001
npm run prod         # Production server
npm run db:init      # Initialize database (alter mode)
npm run db:init:force # Reset database (drops all tables)
```

### Running the Full Application
1. **Setup PostgreSQL database** (see backend/README.md)
2. **Configure environment**: Copy `backend/.env.example` to `backend/.env` and fill in values
3. **Initialize database**: `cd backend && npm run db:init`
4. **Start backend**: `cd backend && npm run dev`
5. **Start frontend**: `cd study-app && npm start`
6. **Access app**: Frontend at http://localhost:3000, Backend at http://localhost:5001

## Architecture Overview

### Frontend Architecture
- **State Management**: Redux Toolkit with RTK Query for API calls
- **Main Components**: Single-page app in `App.tsx` with quiz generation and practice
- **Store Structure**: 
  - `quizSlice`: Manages quiz state, answers, scoring, and wrong answer practice
  - `apiSlice`: Handles backend communication for quiz generation

### Backend Architecture
- **Security Layer**:
  - Helmet.js for security headers (CSP, HSTS, etc.)
  - Rate limiting with tiered limits (general, quiz generation, scraping)
  - Input validation with Joi schemas
  - XSS protection and sanitization
  - HPP (HTTP Parameter Pollution) protection
  - CORS with configurable origins
  - Centralized error handling
  - Request logging with Morgan

- **API Endpoints**:
  - `POST /generate-quiz` - Generate quiz from text/URL
  - `POST /api/quizzes/save` - Save quiz to database
  - `GET /api/quizzes` - List all quizzes (paginated)
  - `GET /api/quizzes/:id` - Get quiz by ID
  - `DELETE /api/quizzes/:id` - Delete quiz
  - `POST /api/quizzes/:id/attempts` - Submit quiz attempt
  - `GET /api/quizzes/:id/attempts` - Get quiz attempts
  - `GET /api/quizzes/stats/overview` - Get statistics

- **Database Layer** (PostgreSQL + Sequelize):
  - `User` model - User accounts with bcrypt hashing
  - `Quiz` model - Stored quizzes with metadata
  - `QuizAttempt` model - Quiz attempts and scores
  - Associations and foreign keys
  - JSONB for flexible question storage

- **AI Integration**:
  - Anthropic Claude Haiku model
  - OpenAI GPT-3.5/4 support
  - Client-side API key management

- **Web Scraping**:
  - Puppeteer for robust content extraction
  - Resource blocking for performance
  - Multiple selector fallbacks
  - Timeout protection

### Data Flow
1. User inputs study material (text or URL) in frontend
2. Frontend sends request to backend `/generate-quiz`
3. Backend processes input (scrapes if URL) and sends to Claude API
4. Claude generates JSON array of multiple-choice questions
5. Backend parses and returns structured quiz data
6. Frontend displays interactive quiz with scoring and wrong answer practice

## Key Features

### Core Features
- AI-powered quiz generation from any text or web content (Anthropic/OpenAI)
- Interactive multiple-choice interface with immediate feedback
- Score tracking and wrong answer practice mode
- URL content extraction using Puppeteer
- Redux state management for quiz lifecycle
- Difficulty levels (easy, moderate, hard)
- Customizable question count (1-20)

### New Features (Database & Security)
- **Quiz History**: Save and manage generated quizzes
- **Performance Tracking**: Track quiz attempts and scores over time
- **Analytics**: View statistics and performance trends
- **Security**: Comprehensive protection against common vulnerabilities
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Input Validation**: Robust validation and sanitization
- **Error Handling**: User-friendly error messages and logging

## Security Features

The backend implements comprehensive security measures:

1. **Helmet.js** - Security headers (CSP, HSTS, X-Frame-Options, etc.)
2. **Rate Limiting** - Tiered limits based on resource intensity
3. **Input Validation** - Joi schema validation on all inputs
4. **XSS Protection** - Input sanitization and output encoding
5. **SQL Injection Prevention** - Sequelize ORM with parameterized queries
6. **CORS** - Controlled cross-origin resource sharing
7. **Error Handling** - No sensitive info leaked in errors
8. **Logging** - Comprehensive request and error logging
9. **Compression** - Response compression for performance
10. **HPP Protection** - HTTP Parameter Pollution prevention

## Backend Structure

```
backend/
├── config/           # Configuration files
├── middleware/       # Express middleware
├── models/          # Database models
├── routes/          # API routes
├── scripts/         # Utility scripts
├── utils/           # Helper utilities
└── validators/      # Input validation
```

See `backend/README.md` for detailed documentation.

## Environment Requirements
- Node.js (v16+) for both frontend and backend
- PostgreSQL (v12+) for database
- Anthropic or OpenAI API key
- Modern browser with JavaScript enabled

## Development Guidelines
- **Always use conventional commits** when creating commits
- Follow the existing code structure and patterns
- Add validation for all user inputs
- Sanitize all outputs to prevent XSS
- Log important events and errors
- Update documentation when adding features