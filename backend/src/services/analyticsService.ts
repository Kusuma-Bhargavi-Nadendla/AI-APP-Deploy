


import Quiz from "../models/Quiz";
import { QUIZ_STATUS } from "../types";

export class AnalyticsService {
  static async getUserAnalytics(userId: string) {
    const quizzes = await Quiz.find({
      userId,
      status: { $in: [QUIZ_STATUS.COMPLETED, QUIZ_STATUS.IN_PROGRESS] }
    }).sort({ startedAt: -1 }).lean();

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

    const completedQuizzes = quizzes.filter(q => q.status === QUIZ_STATUS.COMPLETED && q.finalScore != null);
    const inProgressQuizzes = quizzes.filter(q => q.status === QUIZ_STATUS.IN_PROGRESS);

    const totalQuizzes = quizzes.length;

    let averageScore = 0;
    let highestScore = 0;

    if (completedQuizzes.length > 0) {
      const percentageScores = completedQuizzes.map(quiz => {
        return quiz.questionsCount && quiz.questionsCount > 0 && quiz.finalScore
          ? Number(((quiz.finalScore / (quiz.questionsCount * 10)) * 100).toFixed(1))
          : 0;
      });

      const totalScore = percentageScores.reduce((sum, score) => sum + score, 0);
      averageScore = Number((totalScore / completedQuizzes.length).toFixed(1));
      highestScore = Math.max(...percentageScores);
    }

    const categoryCounts: Record<string, number> = {};
    quizzes.forEach(quiz => {
      categoryCounts[quiz.categoryTitle] = (categoryCounts[quiz.categoryTitle] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Number(((count / totalQuizzes) * 100).toFixed(1))
    }));

    const categoryProgress: Record<string, { scores: number[]; dates: string[]; questionsCounts: number[] }> = {};

    completedQuizzes.forEach(quiz => {
      if (!categoryProgress[quiz.categoryTitle]) {
        categoryProgress[quiz.categoryTitle] = { scores: [], dates: [], questionsCounts: [] };
      }

      const percentageScore = quiz.questionsCount && quiz.questionsCount > 0 && quiz.finalScore
        ? Number(((quiz.finalScore / (quiz.questionsCount * 10)) * 100).toFixed(1))
        : 0;

      categoryProgress[quiz.categoryTitle].scores.push(percentageScore);
      categoryProgress[quiz.categoryTitle].questionsCounts.push(quiz.questionsCount || 0);

      if (quiz.completedAt) {
        categoryProgress[quiz.categoryTitle].dates.push(quiz.completedAt.toISOString().split('T')[0]);
      }
    });

    Object.keys(categoryProgress).forEach(category => {
      const progress = categoryProgress[category];
      const combined = progress.scores.map((score, index) => ({
        score,
        date: progress.dates[index],
        questionsCount: progress.questionsCounts[index]
      }));

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      categoryProgress[category].scores = combined.map(item => item.score);
      categoryProgress[category].dates = combined.map(item => item.date);
      categoryProgress[category].questionsCounts = combined.map(item => item.questionsCount);
    });

    const validCategoryProgress = Object.entries(categoryProgress).filter(([_, data]) => data.scores.length > 0);

    const quizHistory = quizzes.slice(0, 15).map(quiz => ({
      id: quiz._id.toString(),
      date: quiz.startedAt ? quiz.startedAt.toISOString().split('T')[0] : 'Unknown',
      category: quiz.categoryTitle,
      subcategory: quiz.subcategoryTitle,
      score: quiz.finalScore || 0,
      questionsCount: quiz.questionsCount || 0,
      timeSpent: quiz.totalTimeSpent || 0,
      status: quiz.status
    }));

    return {
      totalQuizzes,
      averageScore,
      highestScore,
      categoryProgress: validCategoryProgress.map(([category, data]) => ({
        category,
        scores: data.scores,
        dates: data.dates,
        questionsCounts: data.questionsCounts
      })),
      categoryDistribution,
      quizHistory
    };
  }

  static async getCategoryAnalytics(userId: string, categoryId: string) {
    const quizzes = await Quiz.find({
      userId,
      categoryId,
      status: { $in: [QUIZ_STATUS.COMPLETED, QUIZ_STATUS.IN_PROGRESS] }
    }).sort({ startedAt: -1 });

    return { categoryId, quizCount: quizzes.length };
  }
}