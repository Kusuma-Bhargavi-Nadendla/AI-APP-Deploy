// src/routes/quiz.ts
import express from 'express';
import { quizController } from "../controllers/quizController";
import { authMiddleware } from "../midlleware/auth"

const router = express.Router();

router.use(authMiddleware);

router.post('/start', quizController.startQuiz);
router.post('/submit-answer', quizController.submitAnswer);
router.post('/resume', quizController.resumeQuiz);

export default router;