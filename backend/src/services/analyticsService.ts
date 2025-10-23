// import Quiz from "../models/Quiz";
// import { QUIZ_STATUS } from "../types";

// export class AnalyticsService {
//   static async getUserAnalytics(userId: string) {
//     const quizzes = await Quiz.find({ 
//       userId, 
//       status: { $in: [QUIZ_STATUS.COMPLETED, QUIZ_STATUS.IN_PROGRESS] } ,
//       finalScore: { $exists: true, $ne: null }
//     }).sort({ completedAt: -1 , createdAt: -1}).lean();

//     if (quizzes.length === 0) {
//       return {
//         totalQuizzes: 0,
//         averageScore: 0,
//         highestScore: 0,
//         categoryProgress: [],
//         categoryDistribution: [],
//         quizHistory: []
//       };
//     }

//     const validQuizzes = quizzes.filter((q): q is typeof q & { finalScore: number } => 
//       q.finalScore != null && typeof q.finalScore === 'number'
//     );

//     const totalQuizzes = validQuizzes.length;

//     const averageScore = totalQuizzes > 0 
//       ? Number((validQuizzes.reduce((sum, q) => sum + q.finalScore, 0) / totalQuizzes).toFixed(1))
//       : 0;

//     const highestScore = totalQuizzes > 0
//       ? Math.max(...validQuizzes.map(q => q.finalScore))
//       : 0;

//     const categoryCounts: Record<string, number> = {};
//     validQuizzes.forEach(quiz => {
//       categoryCounts[quiz.categoryTitle] = (categoryCounts[quiz.categoryTitle] || 0) + 1;
//     });

//     const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
//       category,
//       count,
//       percentage: Number(((count / totalQuizzes) * 100).toFixed(1))
//     }));

//     const categoryProgress: Record<string, { scores: number[]; dates: string[] }> = {};
//     validQuizzes.forEach(quiz => {
//       if (!categoryProgress[quiz.categoryTitle]) {
//         categoryProgress[quiz.categoryTitle] = { scores: [], dates: [] };
//       }
//       categoryProgress[quiz.categoryTitle].scores.push(quiz.finalScore);
//       if (quiz.completedAt) {
//         categoryProgress[quiz.categoryTitle].dates.push(quiz.completedAt.toISOString().split('T')[0]);
//       }
//     });

//     const quizHistory = validQuizzes.slice(0, 15).map(quiz => ({
//       id: quiz._id.toString(),
//       date: quiz.completedAt ? quiz.completedAt.toISOString().split('T')[0] : 'Unknown',
//       category: quiz.categoryTitle,
//       subcategory: quiz.subcategoryTitle,
//       score: quiz.finalScore
//     }));

//     return {
//       totalQuizzes,
//       averageScore,
//       highestScore,
//       categoryProgress: Object.entries(categoryProgress).map(([category, data]) => ({
//         category,
//         scores: data.scores.slice(-5),
//         dates: data.dates.slice(-5)
//       })),
//       categoryDistribution,
//       quizHistory
//     };
//   }

//   static async getCategoryAnalytics(userId: string, categoryId: string) {
//     const quizzes = await Quiz.find({ 
//       userId, 
//       categoryId,
//       status: QUIZ_STATUS.COMPLETED
//     }).sort({ completedAt: -1 });

//     return { categoryId, quizCount: quizzes.length };
//   }
// }






// import Quiz from "../models/Quiz";
// import { QUIZ_STATUS } from "../types";

// export class AnalyticsService {
//   static async getUserAnalytics(userId: string) {
//     const quizzes = await Quiz.find({
//       userId,
//       status: { $in: [QUIZ_STATUS.COMPLETED, QUIZ_STATUS.IN_PROGRESS] }
//     }).sort({ startedAt: -1 }).lean();

//     if (quizzes.length === 0) {
//       return {
//         totalQuizzes: 0,
//         averageScore: 0,
//         highestScore: 0,
//         categoryProgress: [],
//         categoryDistribution: [],
//         quizHistory: []
//       };
//     }

//     const completedQuizzes = quizzes.filter(q => q.status === QUIZ_STATUS.COMPLETED && q.finalScore != null);
//     const inProgressQuizzes = quizzes.filter(q => q.status === QUIZ_STATUS.IN_PROGRESS);

//     const totalQuizzes = quizzes.length;

//     let averageScore = 0;
//     let highestScore = 0;

//     if (completedQuizzes.length > 0) {
//       const totalScore = completedQuizzes.reduce((sum, q) => sum + (q.finalScore || 0), 0);
//       averageScore = Number((totalScore / completedQuizzes.length).toFixed(1));
//       highestScore = Math.max(...completedQuizzes.map(q => q.finalScore || 0));
//     }

//     const categoryCounts: Record<string, number> = {};
//     quizzes.forEach(quiz => {
//       categoryCounts[quiz.categoryTitle] = (categoryCounts[quiz.categoryTitle] || 0) + 1;
//     });

//     const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
//       category,
//       count,
//       percentage: Number(((count / totalQuizzes) * 100).toFixed(1))
//     }));

//     const categoryProgress: Record<string, { scores: number[]; dates: string[]; questionsCounts: number[] }> = {};

//     completedQuizzes.forEach(quiz => {
//       if (!categoryProgress[quiz.categoryTitle]) {
//         categoryProgress[quiz.categoryTitle] = { scores: [], dates: [], questionsCounts: [] };
//       }

//       const percentageScore = quiz.questionsCount && quiz.questionsCount > 0 && quiz.finalScore
//         ? Number(((quiz.finalScore / (quiz.questionsCount * 10)) * 100).toFixed(1))
//         : 0;

//       categoryProgress[quiz.categoryTitle].scores.push(percentageScore);
//       categoryProgress[quiz.categoryTitle].questionsCounts.push(quiz.questionsCount || 0);

//       if (quiz.completedAt) {
//         categoryProgress[quiz.categoryTitle].dates.push(quiz.completedAt.toISOString().split('T')[0]);
//       }
//     });

//     const validCategoryProgress = Object.entries(categoryProgress).filter(([_, data]) => data.scores.length > 0);

//     const quizHistory = quizzes.slice(0, 15).map(quiz => ({
//       id: quiz._id.toString(),
//       date: quiz.startedAt ? quiz.startedAt.toISOString().split('T')[0] : 'Unknown',
//       category: quiz.categoryTitle,
//       subcategory: quiz.subcategoryTitle,
//       score: quiz.finalScore || 0,
//       questionsCount: quiz.questionsCount || 0,
//       timeSpent: quiz.totalTimeSpent || 0,
//       status: quiz.status
//     }));

//     return {
//       totalQuizzes,
//       averageScore,
//       highestScore,
//       categoryProgress: validCategoryProgress.map(([category, data]) => ({
//         category,
//         scores: data.scores,
//         dates: data.dates,
//         questionsCounts: data.questionsCounts
//       })),
//       categoryDistribution,
//       quizHistory
//     };
//   }

//   static async getCategoryAnalytics(userId: string, categoryId: string) {
//     const quizzes = await Quiz.find({
//       userId,
//       categoryId,
//       status: { $in: [QUIZ_STATUS.COMPLETED, QUIZ_STATUS.IN_PROGRESS] }
//     }).sort({ startedAt: -1 });

//     return { categoryId, quizCount: quizzes.length };
//   }
// }


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
      const totalScore = completedQuizzes.reduce((sum, q) => sum + (q.finalScore || 0), 0);
      averageScore = Number((totalScore / completedQuizzes.length).toFixed(1));
      highestScore = Math.max(...completedQuizzes.map(q => q.finalScore || 0));
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