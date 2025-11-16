const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quiz = sequelize.define(
  'Quiz',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sourceText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sourceUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Must be a valid URL',
        },
      },
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'moderate', 'hard'),
      allowNull: false,
      defaultValue: 'moderate',
    },
    provider: {
      type: DataTypes.ENUM('anthropic', 'openai'),
      allowNull: false,
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidQuestions(value) {
          if (!Array.isArray(value)) {
            throw new Error('Questions must be an array');
          }
          value.forEach((q) => {
            if (!q.question || !q.options || !q.answer || !q.explanation) {
              throw new Error('Invalid question format');
            }
          });
        },
      },
    },
    questionsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'quizzes',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['difficulty'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

module.exports = Quiz;
