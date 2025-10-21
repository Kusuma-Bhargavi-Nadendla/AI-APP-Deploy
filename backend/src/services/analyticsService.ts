import Quiz from "../models/Quiz";
import { QUIZ_STATUS } from "../types";

export class AnalyticsService {
  static async getUserAnalytics(userId: string) {
    const quizzes = await Quiz.find({ 
      userId, 
      status: QUIZ_STATUS.COMPLETED,
      finalScore: { $exists: true, $ne: null }
    }).sort({ completedAt: -1 }).lean();

    if (quizzes.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        categoryProgress: [],
        categoryDistribution: [],
        quizHistory: []
      };
    }

    const validQuizzes = quizzes.filter((q): q is typeof q & { finalScore: number } => 
      q.finalScore != null && typeof q.finalScore === 'number'
    );

    const totalQuizzes = validQuizzes.length;

    const averageScore = totalQuizzes > 0 
      ? Number((validQuizzes.reduce((sum, q) => sum + q.finalScore, 0) / totalQuizzes).toFixed(1))
      : 0;

    const highestScore = totalQuizzes > 0
      ? Math.max(...validQuizzes.map(q => q.finalScore))
      : 0;

    const categoryCounts: Record<string, number> = {};
    validQuizzes.forEach(quiz => {
      categoryCounts[quiz.categoryTitle] = (categoryCounts[quiz.categoryTitle] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Number(((count / totalQuizzes) * 100).toFixed(1))
    }));

    const categoryProgress: Record<string, { scores: number[]; dates: string[] }> = {};
    validQuizzes.forEach(quiz => {
      if (!categoryProgress[quiz.categoryTitle]) {
        categoryProgress[quiz.categoryTitle] = { scores: [], dates: [] };
      }
      categoryProgress[quiz.categoryTitle].scores.push(quiz.finalScore);
      if (quiz.completedAt) {
        categoryProgress[quiz.categoryTitle].dates.push(quiz.completedAt.toISOString().split('T')[0]);
      }
    });

    const quizHistory = validQuizzes.slice(0, 15).map(quiz => ({
      id: quiz._id.toString(),
      date: quiz.completedAt ? quiz.completedAt.toISOString().split('T')[0] : 'Unknown',
      category: quiz.categoryTitle,
      subcategory: quiz.subcategoryTitle,
      score: quiz.finalScore
    }));

    return {
      totalQuizzes,
      averageScore,
      highestScore,
      categoryProgress: Object.entries(categoryProgress).map(([category, data]) => ({
        category,
        scores: data.scores.slice(-5),
        dates: data.dates.slice(-5)
      })),
      categoryDistribution,
      quizHistory
    };
  }

  static async getCategoryAnalytics(userId: string, categoryId: string) {
    const quizzes = await Quiz.find({ 
      userId, 
      categoryId,
      status: QUIZ_STATUS.COMPLETED
    }).sort({ completedAt: -1 });

    return { categoryId, quizCount: quizzes.length };
  }
}