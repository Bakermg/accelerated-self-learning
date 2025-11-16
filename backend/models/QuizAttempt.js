const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuizAttempt = sequelize.define(
  'QuizAttempt',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'For anonymous users',
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Object mapping question index to selected answer',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    percentageScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time spent in seconds',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    wrongAnswers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of question indices that were answered incorrectly',
    },
  },
  {
    tableName: 'quiz_attempts',
    timestamps: true,
    indexes: [
      {
        fields: ['quizId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['sessionId'],
      },
      {
        fields: ['completedAt'],
      },
    ],
  }
);

module.exports = QuizAttempt;
