import mongoose from 'mongoose';
import {  QUIZ_STATUS,  QUIZ_QUESTIONS_COUNT, TOTAL_TIME_OPTIONS, QUESTION_TIME_OPTIONS } from "../types";
import { QUIZ_CONFIG } from "../config/constants";

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  categoryId: { type: String, required: true },
  categoryTitle: { type: String, required: true },
  
  subcategoryTitle: { type: String, required: true },
  questionsCount: { type: Number, default: QUIZ_QUESTIONS_COUNT.THREE },

  totalTimeEnabled: { type: Boolean, default: QUIZ_CONFIG.timeLimitEnabled },
  totalTimeLimit: { type: Number, default: TOTAL_TIME_OPTIONS.DISABLED },
  questionTimeEnabled: { type: Boolean, default: QUIZ_CONFIG.timeLimitPerQuestionEnabled },
  questionTimeLimit: { type: Number, default: QUESTION_TIME_OPTIONS.DISABLED },
  
  currentQuestionNumber: { type: Number, default: 1 },
  status: { type: String, enum: Object.values(QUIZ_STATUS), default: QUIZ_STATUS.IN_PROGRESS },
  
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  totalTimeSpent: { type: Number, default: 0 },
  
  finalScore: { type: Number },
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);