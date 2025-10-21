import { QUIZ_QUESTIONS_COUNT } from "../types"
import jwt, { SignOptions } from 'jsonwebtoken';
export const JWT_CONFIG :SignOptions = {
  expiresIn: "7d",
};

export const QUIZ_CONFIG = {
  defaultQuestionsCount: QUIZ_QUESTIONS_COUNT.THREE,
  minDifficulty: 1,
  maxDifficulty: 5,
  timeLimitEnabled:false,
  timeLimitPerQuestionEnabled: false,
};