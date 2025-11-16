/**
 * IndexedDB utility for storing quiz history and attempts locally in the browser
 */

export interface StoredQuiz {
  id: string;
  title: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  provider: 'anthropic' | 'openai';
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
  questionsCount: number;
  tags?: string[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  answers: Record<number, string>;
  score: number;
  totalQuestions: number;
  percentageScore: string;
  timeSpent?: number;
  completedAt: string;
}

const DB_NAME = 'StudyQuizDB';
const DB_VERSION = 1;
const QUIZ_STORE = 'quizzes';
const ATTEMPT_STORE = 'attempts';

class QuizStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create quizzes store
        if (!db.objectStoreNames.contains(QUIZ_STORE)) {
          const quizStore = db.createObjectStore(QUIZ_STORE, { keyPath: 'id' });
          quizStore.createIndex('createdAt', 'createdAt', { unique: false });
          quizStore.createIndex('difficulty', 'difficulty', { unique: false });
        }

        // Create attempts store
        if (!db.objectStoreNames.contains(ATTEMPT_STORE)) {
          const attemptStore = db.createObjectStore(ATTEMPT_STORE, { keyPath: 'id' });
          attemptStore.createIndex('quizId', 'quizId', { unique: false });
          attemptStore.createIndex('completedAt', 'completedAt', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Quiz operations
  async saveQuiz(quiz: Omit<StoredQuiz, 'id' | 'createdAt'>): Promise<StoredQuiz> {
    const db = await this.ensureDB();
    const storedQuiz: StoredQuiz = {
      ...quiz,
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUIZ_STORE], 'readwrite');
      const store = transaction.objectStore(QUIZ_STORE);
      const request = store.add(storedQuiz);

      request.onsuccess = () => resolve(storedQuiz);
      request.onerror = () => reject(request.error);
    });
  }

  async getQuizzes(options?: {
    difficulty?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ quizzes: StoredQuiz[]; total: number }> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUIZ_STORE], 'readonly');
      const store = transaction.objectStore(QUIZ_STORE);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // newest first

      const allQuizzes: StoredQuiz[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const quiz = cursor.value as StoredQuiz;
          // Filter by difficulty if specified
          if (!options?.difficulty || quiz.difficulty === options.difficulty) {
            allQuizzes.push(quiz);
          }
          cursor.continue();
        } else {
          // Apply pagination
          const offset = options?.offset || 0;
          const limit = options?.limit || allQuizzes.length;
          const paginatedQuizzes = allQuizzes.slice(offset, offset + limit);

          resolve({
            quizzes: paginatedQuizzes,
            total: allQuizzes.length,
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getQuizById(id: string): Promise<StoredQuiz | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUIZ_STORE], 'readonly');
      const store = transaction.objectStore(QUIZ_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteQuiz(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUIZ_STORE, ATTEMPT_STORE], 'readwrite');

      // Delete quiz
      const quizStore = transaction.objectStore(QUIZ_STORE);
      quizStore.delete(id);

      // Delete all attempts for this quiz
      const attemptStore = transaction.objectStore(ATTEMPT_STORE);
      const index = attemptStore.index('quizId');
      const request = index.openCursor(IDBKeyRange.only(id));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Attempt operations
  async saveAttempt(
    quizId: string,
    data: { answers: Record<number, string>; score: number; totalQuestions: number; timeSpent?: number }
  ): Promise<QuizAttempt> {
    const db = await this.ensureDB();
    const percentageScore = ((data.score / data.totalQuestions) * 100).toFixed(1);

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quizId,
      answers: data.answers,
      score: data.score,
      totalQuestions: data.totalQuestions,
      percentageScore,
      timeSpent: data.timeSpent,
      completedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ATTEMPT_STORE], 'readwrite');
      const store = transaction.objectStore(ATTEMPT_STORE);
      const request = store.add(attempt);

      request.onsuccess = () => resolve(attempt);
      request.onerror = () => reject(request.error);
    });
  }

  async getAttempts(quizId?: string): Promise<QuizAttempt[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ATTEMPT_STORE], 'readonly');
      const store = transaction.objectStore(ATTEMPT_STORE);

      let request: IDBRequest;
      if (quizId) {
        const index = store.index('quizId');
        request = index.getAll(quizId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const attempts = request.result as QuizAttempt[];
        // Sort by most recent first
        attempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        resolve(attempts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getStats(): Promise<{
    totalAttempts: number;
    averageScore: string;
    averagePercentage: string;
    averageTimeSpent: number;
    recentAttempts: QuizAttempt[];
  }> {
    const attempts = await this.getAttempts();

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: '0',
        averagePercentage: '0',
        averageTimeSpent: 0,
        recentAttempts: [],
      };
    }

    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const attemptsWithTime = attempts.filter(a => a.timeSpent).length;

    const averageScore = (totalScore / attempts.length).toFixed(1);
    const averagePercentage = ((totalScore / totalQuestions) * 100).toFixed(1);
    const averageTimeSpent = attemptsWithTime > 0 ? Math.round(totalTime / attemptsWithTime) : 0;

    return {
      totalAttempts: attempts.length,
      averageScore,
      averagePercentage,
      averageTimeSpent,
      recentAttempts: attempts.slice(0, 10),
    };
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUIZ_STORE, ATTEMPT_STORE], 'readwrite');

      transaction.objectStore(QUIZ_STORE).clear();
      transaction.objectStore(ATTEMPT_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
export const quizStorage = new QuizStorage();
