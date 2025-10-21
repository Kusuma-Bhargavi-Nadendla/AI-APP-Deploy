import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';

export const analyticsController = {
  async getUserAnalytics(req: Request, res: Response) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required'
        });
      }

      const analytics = await AnalyticsService.getUserAnalytics(userId);

      res.json({
        success: true,
        message: 'Analytics fetched successfully',
        data: analytics
      });
    } catch (error: any) {
      console.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user analytics: ' + error.message
      });
    }
  },

  async getCategoryAnalytics(req: Request, res: Response) {
    try {
      const { userId, categoryId } = req.body;

      if (!userId || !categoryId) {
        return res.status(400).json({
          success: false,
          error: 'userId and categoryId are required'
        });
      }

      const analytics = await AnalyticsService.getCategoryAnalytics(userId, categoryId);

      res.json({
        success: true,
        message: 'Category analytics fetched successfully',
        data: analytics
      });
    } catch (error: any) {
      console.error('Get category analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch category analytics: ' + error.message
      });
    }
  },

  async getQuizHistory(req: Request, res: Response) {
    try {
      const { userId, limit = 10 } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required'
        });
      }

      const analytics = await AnalyticsService.getUserAnalytics(userId);
      const quizHistory = analytics.quizHistory.slice(0, limit);

      res.json({
        success: true,
        message: 'Quiz history fetched successfully',
        data: {
          quizHistory,
          total: analytics.quizHistory.length
        }
      });
    } catch (error: any) {
      console.error('Get quiz history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quiz history: ' + error.message
      });
    }
  }
};