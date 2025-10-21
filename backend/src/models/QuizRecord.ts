import mongoose from 'mongoose';
import {  QUESTION_TYPES } from "../types";
import { QUIZ_CONFIG } from "../config/constants";

const quizRecordSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  categoryId: { type: String, required: true },
  categoryTitle: { type: String, required: true },
  subcategoryTitle: { type: String, required: true },
  
  question: { type: String, required: true },
  options: [{ type: String }],
  
  userAnswer: { type: String },
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  score: { type: Number, default: 0 },
  
  difficultyLevel: { type: Number, default: QUIZ_CONFIG.defaultQuestionsCount, min:QUIZ_CONFIG.minDifficulty, max: QUIZ_CONFIG.maxDifficulty },
  questionType: { type: String, enum: Object.values(QUESTION_TYPES), default: QUESTION_TYPES.MULTIPLE_CHOICE },
  timeSpent: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('QuizRecord', quizRecordSchema);