import { Request, Response } from 'express';
import {QuizService} from "../services/quizService";
import { QUIZ_QUESTIONS_COUNT } from "../types";
export const quizController = {
  async startQuiz(req: Request, res: Response) {
    try {
      const { 
        userId, 
        categoryId, 
        categoryTitle, 
        subcategoryTitle, 
        questionsCount = QUIZ_QUESTIONS_COUNT.THREE,
        timeSettings = {}
      } = req.body;

      if (!userId || !categoryId || !categoryTitle || !subcategoryTitle) {
        return res.status(400).json({
          success: false,
          error: 'userId, categoryId, categoryTitle, and subcategoryTitle are required'
        });
      }

      const result = await QuizService.startQuiz(
        userId, 
        categoryId, 
        categoryTitle, 
        subcategoryTitle, 
        questionsCount, 
        timeSettings
      );

      res.json({
        success: true,
        message: 'Quiz started successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Start quiz error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start quiz: ' + error.message
      });
    }
  },

  async submitAnswer(req: Request, res: Response) {
    try {
      const { 
        quizData, 
        currentQuestion, 
        userAnswer, 
        progress, 
        timeSpent = 0 
      } = req.body;

      if (!quizData || !currentQuestion || !userAnswer || !progress) {
        return res.status(400).json({
          success: false,
          error: 'quizData, currentQuestion, userAnswer, and progress are required'
        });
      }

      const result = await QuizService.submitAnswer(
        quizData, 
        currentQuestion, 
        userAnswer, 
        progress, 
        timeSpent
      );

      res.json({
        success: true,
        message: result.quizCompleted ? 'Quiz completed!' : 'Answer submitted',
        data: result
      });
    } catch (error: any) {
      console.error('Submit answer error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit answer: ' + error.message
      });
    }
  },

  async resumeQuiz(req: Request, res: Response) {
    try {
      const { userId,quizId } = req.body;

      if (!quizId) {
        return res.status(400).json({
          success: false,
          error: 'quizId is required'
        });
      }
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required'
        });
      }
      const result = await QuizService.resumeQuiz(userId,quizId);
      res.json({
        success: true,
        message: 'Quiz started successfully',
        data: result
      });


      res.status(501).json({
        success: false,
        error: 'Resume quiz feature not implemented yet'
      });
    } catch (error: any) {
      console.error('Resume quiz error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resume quiz: ' + error.message
      });
    }
  },

  async getQuizPreview(req: Request, res: Response) {
    try {
      const userId = req.body.userId;
      const quizId=req.body.quizId;

      if (!quizId) {
        return res.status(400).json({
          success: false,
          error: 'Quiz ID is required'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const previewData = await QuizService.getQuizPreview(quizId, userId);

      res.json({
        success: true,
        message: 'Quiz preview loaded successfully',
        data: previewData
      });
    } catch (error: any) {
      console.error('Get quiz preview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load quiz preview: ' + error.message
      });
    }
  }


};