export interface TimeSettings {
  totalEnabled: boolean;
  totalMinutes?: number;
  perQuestionEnabled: boolean;
  perQuestionSeconds?: number;
}
export interface SessionData {
  sessionId: string;
  userId: string;
  category: string;
  categoryDescription: string;
  subcategory: string;
  subcategoryDescription: string;
  quizSlugId: string;
  questionsCount: number;
  timeSettings: TimeSettings;
  quizId: string;
  status: 'preview' | 'in-progress' | 'completed' | 'paused';
  currentQuestionIndex: number;
  score?: number;
  startTime: Date;
  endTime?: Date;
  updatedAt: Date;
  performanceFeedback?: string;
}
export interface AIQuestion {
  questionText: string;
  options: string[];
  questionType: "options" | "descriptive";
  difficultyLevel: number;
  questionId: string;
}

export interface QuizRecord {
  _id: string;
  question: string;
  options: string[];
  questionType: "options" | "descriptive";
  difficultyLevel: number;
  questionId: string;
  correctAnswer?: string;
  userAnswer?: string;
  explanation?: string;
  score: number;
  sequenceNumber: number;
}

export interface QuizPreviewData {
  quizId: string;
  records: QuizRecord[];
  totalScore: number;
  totalQuestions: number;
  categoryTitle: string;
  subcategoryTitle: string;
  completedAt?: string;
  evaluation?: string;
  status: string;
  startedAt?: string;
  questionsCount: number;
}

export interface CategoryCardProps {
  categoryTitle: string;
  description?: string;
  trending?: boolean;
  color?: string;
  id?: string;
  onArrowClick: () => void;
}


export interface AnalyticsData {
    totalQuizzes: number
    averageScore: number
    highestScore: number
    categoryProgress: Array<{
        category: string
        scores: number[]
        dates: string[]
    }>
    categoryDistribution: Array<{
        category: string
        count: number
        percentage: number
    }>
    quizHistory: Array<{
        id: string
        date: string
        category: string
        subcategory: string
        score: number
        questionsCount: number
        timeSpent: number
        status: 'completed' | 'in-progress'
    }>
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  usersTaken?: number;
  trending?: boolean;
  isNew?: boolean;
  color?: string;
}

export interface QuizLandingData {
  categoryTitle: string;
  subcategoryTitle: string;
  description: string;
  questionsCount?: number;
  timeLimit?: number;
  categoryId?: string;
}

export interface CacheInfo {
  cached: boolean;
  age?: string;
}

export interface SubcategoryCardProps {
  subcategoryTitle: string;
  subcategoryDescription: string;
  usersTaken?: number;
  trending?: boolean;
  isNew?: boolean;
  color?: string;
  onStartTest: () => void;
}

export interface QuestionProps {
  questionText: string;
  questionType: "multiple_choice" | "descriptive";
  options?: string[];
  mode: "quiz" | "preview" | "practice";
  currentQuestion?: number;
  totalQuestions?: number;
  correctAnswer?: string;
  userAnswer?: string;
  score?: number;
  explanation?: string;
  onAnswer?: (answer: string) => void;
  onNext?: () => void;
  onRecord?: (isRecording: boolean) => void;
  timeSettings?: {
    questionTimeLimit?: number;
    totalTimeLimit?: number;
    elapsedTotalTime?: number;
  };
  onClearRecording?: () => void;
}

export interface PageProps {
  params: Promise<{
    category: string;
  }>;

}