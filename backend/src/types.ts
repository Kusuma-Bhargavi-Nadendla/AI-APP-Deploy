export const QUIZ_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const;

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  DESCRIPTIVE: 'descriptive'
} as const;

export const DIFFICULTY_LEVELS = {
  BEGINNER: 1,
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  EXPERT: 5
};

export const TOTAL_TIME_OPTIONS = {
  DISABLED: 0,
  FIVE_MIN: 5,
  TEN_MIN: 10,
  FIFTEEN_MIN: 15,
  THIRTY_MIN: 30
};

export const QUESTION_TIME_OPTIONS = {
  DISABLED: 0,
  THIRTY_SEC: 30,
  SIXTY_SEC: 60,
  NINETY_SEC: 90,
  TWO_MIN: 120
};

export const QUIZ_QUESTIONS_COUNT = {
    UNLIMITED: 0,
    THREE: 3,
    FIVE: 5,
    TEN: 10,
    FIFTEEN: 15,
    THIRTY: 30
}

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
}

export interface Quiz {
  _id: string;
  userId: string;
  
  categoryId: string;
  categoryTitle: string;
  subcategoryTitle: string;
  
  questionsCount: typeof QUIZ_QUESTIONS_COUNT;
  
  totalTimeEnabled: boolean;
  totalTimeLimit: typeof TOTAL_TIME_OPTIONS;
  questionTimeEnabled: boolean;
  questionTimeLimit: typeof QUESTION_TIME_OPTIONS;
  
  currentQuestionNumber: number;
  status: typeof QUIZ_STATUS;
  
  startedAt: Date;
  completedAt?: Date;
  totalTimeSpent: number;
  
  finalScore?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizCreate {
  userId: string;
  categoryId: string;
  categoryTitle: string;
  subcategoryTitle: string;
  questionsCount?: typeof QUIZ_QUESTIONS_COUNT;
  totalTimeEnabled?: boolean;
  totalTimeLimit?: typeof TOTAL_TIME_OPTIONS;
  questionTimeEnabled?: boolean;
  questionTimeLimit?: typeof QUESTION_TIME_OPTIONS;
}

export interface QuizRecord {
  _id: string;
  quizId: string;
  userId: string;
  
  categoryId: string;
  categoryTitle: string;
  subcategoryTitle: string;
  
  question: string;
  options: string[];
  
  userAnswer?: string;
  correctAnswer: string;
  explanation?: string;
  score: number;
  
  difficultyLevel: number;
  questionType: typeof QUESTION_TYPES;
  timeSpent: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizRecordCreate {
  quizId: string;
  userId: string;
  categoryId: string;
  categoryTitle: string;
  subcategoryTitle: string;
  question: string;
  options: string[];
  userAnswer?: string;
  correctAnswer: string;
  explanation?: string;
  score: number;
  difficultyLevel: number;
  questionType: typeof QUESTION_TYPES;
  timeSpent: number;
}


export interface AICategoryResponse {
  name: string;
  description: string;
  trending: boolean;
  cachedId?: string;
}