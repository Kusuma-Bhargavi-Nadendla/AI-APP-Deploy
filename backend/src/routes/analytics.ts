import express from 'express';
import { analyticsController } from "../controllers/analyticsController"
import { authMiddleware }  from "../midlleware/auth"

const router = express.Router();

router.use(authMiddleware);

router.post('/user', analyticsController.getUserAnalytics);
router.post('/category', analyticsController.getCategoryAnalytics);
router.post('/history', analyticsController.getQuizHistory);

export default router;