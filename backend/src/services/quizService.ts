import Quiz from "../models/Quiz"
import QuizRecord from "../models/QuizRecord"
import { AIService } from "./aiService"
import { QUESTION_TYPES , QUIZ_STATUS, QUIZ_QUESTIONS_COUNT} from "../types"

export class QuizService {
  static async startQuiz(
    userId: string, 
    categoryId: string, 
    categoryTitle: string, 
    subcategoryTitle: string, 
    questionsCount= QUIZ_QUESTIONS_COUNT.THREE,
    timeSettings: {
      totalTimeEnabled?: boolean;
      totalTimeLimit?: number;
      questionTimeEnabled?: boolean;
      questionTimeLimit?: number;
    } = {}
  ) {
    const {
      totalTimeEnabled = false,
      totalTimeLimit = 0,
      questionTimeEnabled = false, 
      questionTimeLimit = 0
    } = timeSettings;

    const newQuiz = new Quiz({
      userId,
      categoryId,
      categoryTitle,
      subcategoryTitle,
      questionsCount,
      totalTimeEnabled,
      totalTimeLimit,
      questionTimeEnabled,
      questionTimeLimit,
      status: QUIZ_STATUS.IN_PROGRESS,
      startedAt: new Date(),
      currentQuestionNumber: 1
    });
    
    await newQuiz.save();

    // ✅ FIXED: Pass correct number of arguments
    const firstQuestion = await AIService.generateQuestion(categoryTitle, subcategoryTitle, 3, QUESTION_TYPES.MULTIPLE_CHOICE);

    return {
      quizId: newQuiz._id.toString(),
      question: firstQuestion,
      currentQuestionNumber: 1,
      timeSettings: {
        totalTimeEnabled,
        totalTimeLimit,
        questionTimeEnabled,
        questionTimeLimit
      }
    };
  }

  static async submitAnswer(quizData: {
    quizId: string;
    userId: string;
    categoryId: string;
    categoryTitle: string;
    subcategoryTitle: string;
    totalTimeSpent?: number;
  }, currentQuestion: {
    questionId: string;
    questionText: string;
    options: string[];
    questionType:  string;
    difficultyLevel: number;
  }, userAnswer: string, progress: {
    current: number;
    total: number;
  }, timeSpent: number = 0) {
    
    // ✅ FIXED: Pass correct arguments to evaluateAnswer
    const aiResponse = await AIService.evaluateAnswer({
      questionData: {
        text: currentQuestion.questionText,
        options: currentQuestion.options,
        type: currentQuestion.questionType,
        difficulty: currentQuestion.difficultyLevel
      },
      userAnswer,
      category: quizData.categoryTitle,
      subcategory: quizData.subcategoryTitle
    });
    const validts=isNaN(timeSpent) ? 0 : timeSpent;

    // Save quiz record
    const quizRecord = new QuizRecord({
      quizId: quizData.quizId,
      userId: quizData.userId,
      categoryId: quizData.categoryId,
      categoryTitle: quizData.categoryTitle,
      subcategoryTitle: quizData.subcategoryTitle,
      question: currentQuestion.questionText,
      questionId: currentQuestion.questionId,
      questionNumber: progress.current,
      options: currentQuestion.options,
      userAnswer,
      correctAnswer: aiResponse.correctAnswer,
      score: aiResponse.score,
      explanation: aiResponse.explanation,
      difficultyLevel: currentQuestion.difficultyLevel,
      questionType: currentQuestion.questionType,
      timeSpent:validts,
      sequenceNumber: progress.current
    });
    await quizRecord.save();

    // Update quiz progress
    const updateData: any = {
      currentQuestionNumber: progress.current + 1,
      totalTimeSpent: quizData.totalTimeSpent || 0+ timeSpent,
      lastActivityAt: new Date()
    };

    if (aiResponse.wasCorrect) {
      updateData.$inc = { correctAnswers: 1 };
    }

    await Quiz.findByIdAndUpdate(quizData.quizId, updateData);

    // Check if quiz completed
    if (progress.current >= progress.total) {
      const { totalScore: finalScore, evaluation } = await this.calculateFinalScore(quizData.quizId);

      await Quiz.findByIdAndUpdate(quizData.quizId, {
        status: QUIZ_STATUS.COMPLETED,
        finalScore,
        completedAt: new Date()
      });

      return {
        evaluation: {
          wasCorrect: aiResponse.wasCorrect,
          correctAnswer: aiResponse.correctAnswer,
          score: aiResponse.score,
          explanation: aiResponse.explanation
        },
        quizCompleted: true,
        finalScore,
        finalFeedback: evaluation
      };
    }

    // Generate next question
    let nextDifficulty;
    if (aiResponse.wasCorrect) {
      nextDifficulty = Math.min(currentQuestion.difficultyLevel + 1, 5);
    } else {
      nextDifficulty = Math.max(currentQuestion.difficultyLevel - 1, 1);
    }

    let nextType = Math.random() > 0.7 ? QUESTION_TYPES.DESCRIPTIVE : QUESTION_TYPES.MULTIPLE_CHOICE;
    
    // ✅ FIXED: Pass correct number of arguments
    const nextQuestion = await AIService.generateQuestion(
      quizData.categoryTitle,
      quizData.subcategoryTitle,
      nextDifficulty,
      nextType
    );

    return {
      evaluation: {
        wasCorrect: aiResponse.wasCorrect,
        correctAnswer: aiResponse.correctAnswer,
        score: aiResponse.score,
        explanation: aiResponse.explanation
      },
      nextQuestion: {
        questionId: nextQuestion.questionId,
        questionText: nextQuestion.questionText,
        options: nextQuestion.options,
        questionType: nextQuestion.questionType,
        difficultyLevel: nextQuestion.difficultyLevel
      },
      progress: {
        current: progress.current + 1,
        total: progress.total
      },
      currentQuestionNumber: progress.current + 1
    };
  }

  static async calculateFinalScore(quizId: string): Promise<{ totalScore: number; evaluation: string }> {
    const quizRecords = await QuizRecord.find({ quizId });

    if (quizRecords.length === 0) {
      return { totalScore: 0, evaluation: "No questions were answered." };
    }

    const totalScore = quizRecords.reduce((sum, record) => sum + record.score, 0);
    const maxPossibleScore = quizRecords.length * 10;

    const evaluation = await AIService.generateQuizEvaluation(totalScore, maxPossibleScore, quizRecords);

    return { totalScore, evaluation };
  }
}