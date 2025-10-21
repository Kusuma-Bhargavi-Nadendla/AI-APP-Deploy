import express from 'express';
import { authController } from "../controllers/authController"
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/validate-auth-token', authController.validateToken);

export default router;