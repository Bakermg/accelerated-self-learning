# AI Study Quiz Backend

Enhanced backend server with comprehensive security features and database persistence for the AI Study Quiz application.

## Features

### Security Enhancements
- ✅ **Helmet.js** - Security headers (CSP, HSTS, etc.)
- ✅ **Rate Limiting** - Tiered rate limiting for different endpoints
- ✅ **Input Validation** - Joi schema validation
- ✅ **XSS Protection** - Input sanitization and output encoding
- ✅ **HPP Protection** - HTTP Parameter Pollution prevention
- ✅ **CORS Configuration** - Controlled cross-origin requests
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Request Logging** - Morgan logger with custom formatting
- ✅ **Compression** - Response compression

### Database Features
- ✅ **PostgreSQL** - Relational database with Sequelize ORM
- ✅ **Quiz Storage** - Persistent quiz history
- ✅ **Quiz Attempts** - Track user performance over time
- ✅ **User Management** - User accounts with bcrypt password hashing
- ✅ **Statistics** - Performance analytics and insights

### API Features
- ✅ **Quiz Generation** - AI-powered quiz creation (Anthropic/OpenAI)
- ✅ **Quiz History** - CRUD operations for quizzes
- ✅ **Attempt Tracking** - Save and retrieve quiz attempts
- ✅ **Analytics** - Performance statistics and trends
- ✅ **Web Scraping** - Puppeteer-based content extraction

## Project Structure

```
backend/
├── config/
│   ├── config.js           # Environment configuration
│   └── database.js         # Database connection setup
├── middleware/
│   ├── rateLimiter.js      # Rate limiting middleware
│   └── errorHandler.js     # Error handling middleware
├── models/
│   ├── User.js             # User model
│   ├── Quiz.js             # Quiz model
│   ├── QuizAttempt.js      # Quiz attempt model
│   └── index.js            # Model associations
├── routes/
│   └── quizRoutes.js       # Quiz API routes
├── scripts/
│   └── initDb.js           # Database initialization script
├── utils/
│   ├── logger.js           # Logging utility
│   └── sanitizer.js        # Input sanitization utility
├── validators/
│   └── quizValidator.js    # Request validation schemas
├── .env.example            # Environment variables template
├── index.js                # Main application entry point
└── package.json            # Dependencies and scripts
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Anthropic or OpenAI API key

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Install PostgreSQL if you haven't already:

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Create Database:**
```bash
psql postgres
CREATE DATABASE study_quiz_db;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE study_quiz_db TO your_username;
\q
```

### 3. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=study_quiz_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=false

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Security
TRUST_PROXY=false

# AI Configuration
MAX_TOKENS=4096
SCRAPING_TIMEOUT=30000
MAX_CONTENT_LENGTH=4000
```

### 4. Initialize Database

Run the database initialization script:
```bash
npm run db:init
```

**Warning:** To completely reset the database (drops all tables):
```bash
npm run db:init:force
```

### 5. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run prod
```

The server will start on `http://localhost:5001`

## API Endpoints

### Core Endpoints

#### Health Check
```http
GET /health
```

#### Root
```http
GET /
```

### Quiz Generation

#### Generate Quiz (Original Endpoint)
```http
POST /generate-quiz
Content-Type: application/json

{
  "inputText": "Your study material or URL",
  "numQuestions": 5,
  "difficulty": "moderate",
  "apiKey": "your-api-key",
  "provider": "anthropic"
}
```

**Rate Limit:** 10 requests per 15 minutes per IP

### Quiz Management

#### Save Quiz
```http
POST /api/quizzes/save
Content-Type: application/json

{
  "questions": [...],
  "sourceText": "...",
  "difficulty": "moderate",
  "provider": "anthropic",
  "title": "My Quiz",
  "tags": ["javascript", "web"]
}
```

#### Get All Quizzes
```http
GET /api/quizzes?page=1&limit=10&difficulty=moderate
```

#### Get Quiz by ID
```http
GET /api/quizzes/:id
```

#### Delete Quiz
```http
DELETE /api/quizzes/:id
```

### Quiz Attempts

#### Submit Quiz Attempt
```http
POST /api/quizzes/:id/attempts
Content-Type: application/json

{
  "answers": {
    "0": "Answer 1",
    "1": "Answer 2"
  },
  "timeSpent": 120,
  "sessionId": "optional-session-id"
}
```

#### Get Quiz Attempts
```http
GET /api/quizzes/:id/attempts?page=1&limit=10
```

#### Get Statistics
```http
GET /api/quizzes/stats/overview?sessionId=optional-session-id
```

## Rate Limiting

Different rate limits for different operations:

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Quiz Generation | 10 requests | 15 minutes |
| Web Scraping | 20 requests | 1 hour |

## Security Features

### Input Validation
All inputs are validated using Joi schemas:
- Input text: 10-50,000 characters
- Number of questions: 1-20
- Difficulty: easy, moderate, hard
- Provider: anthropic, openai

### Sanitization
- HTML/Script tag removal
- XSS prevention
- URL validation
- SQL injection prevention (via Sequelize)

### Security Headers
Helmet.js provides:
- Content Security Policy
- HTTP Strict Transport Security
- X-Frame-Options
- X-Content-Type-Options
- And more...

## Database Schema

### Users Table
- id (UUID, PK)
- email (String, unique)
- password (String, hashed)
- name (String)
- isActive (Boolean)
- lastLogin (DateTime)
- createdAt, updatedAt

### Quizzes Table
- id (UUID, PK)
- userId (UUID, FK)
- title (String)
- sourceText (Text)
- sourceUrl (String)
- difficulty (Enum: easy, moderate, hard)
- provider (Enum: anthropic, openai)
- questions (JSONB)
- questionsCount (Integer)
- tags (Array)
- isPublic (Boolean)
- createdAt, updatedAt

### QuizAttempts Table
- id (UUID, PK)
- quizId (UUID, FK)
- userId (UUID, FK, nullable)
- sessionId (String, for anonymous users)
- answers (JSONB)
- score (Integer)
- totalQuestions (Integer)
- percentageScore (Float)
- timeSpent (Integer, seconds)
- wrongAnswers (JSONB)
- completedAt (DateTime)
- createdAt, updatedAt

## Error Handling

All errors return consistent JSON format:
```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Logging

Morgan logger with custom formatting:
- **Development:** Colorized console output
- **Production:** JSON formatted logs

Log levels:
- INFO: General information
- WARN: Warnings
- ERROR: Errors with stack traces
- DEBUG: Development debugging (dev only)

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5001
DB_SSL=true
TRUST_PROXY=true
CORS_ORIGIN=https://yourdomain.com
```

### Database Migrations
In production, use proper database migrations instead of `db:init`:
1. Use Sequelize CLI for migrations
2. Never use `--force` flag
3. Backup database before migrations

### Process Management
Use PM2 or similar for production:
```bash
npm install -g pm2
pm2 start index.js --name "quiz-backend"
pm2 startup
pm2 save
```

## Testing

To test the security features:

1. **Rate Limiting:**
```bash
for i in {1..15}; do curl http://localhost:5001/health; done
```

2. **Input Validation:**
```bash
curl -X POST http://localhost:5001/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{"inputText": "test"}'
```

3. **XSS Protection:**
```bash
curl -X POST http://localhost:5001/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{"inputText": "<script>alert(1)</script>", "numQuestions": 5, "difficulty": "easy", "apiKey": "test", "provider": "anthropic"}'
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Test connection
psql -U your_username -d study_quiz_db
```

### Port Already in Use
```bash
# Find process using port 5001
lsof -i :5001

# Kill process
kill -9 <PID>
```

### Puppeteer Issues
```bash
# Install system dependencies (Ubuntu)
sudo apt-get install -y chromium-browser
```

## Contributing

When making changes:
1. Follow conventional commits format
2. Update this README
3. Add tests for new features
4. Run security checks

## License

ISC
