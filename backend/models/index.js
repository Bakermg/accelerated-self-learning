const { sequelize } = require('../config/database');
const User = require('./User');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');

// Define associations

// User has many Quizzes
User.hasMany(Quiz, {
  foreignKey: 'userId',
  as: 'quizzes',
  onDelete: 'CASCADE',
});

Quiz.belongsTo(User, {
  foreignKey: 'userId',
  as: 'creator',
});

// User has many QuizAttempts
User.hasMany(QuizAttempt, {
  foreignKey: 'userId',
  as: 'attempts',
  onDelete: 'SET NULL',
});

QuizAttempt.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Quiz has many QuizAttempts
Quiz.hasMany(QuizAttempt, {
  foreignKey: 'quizId',
  as: 'attempts',
  onDelete: 'CASCADE',
});

QuizAttempt.belongsTo(Quiz, {
  foreignKey: 'quizId',
  as: 'quiz',
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Quiz,
  QuizAttempt,
};
