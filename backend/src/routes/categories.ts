import express from 'express';
import { categoryController } from '../controllers/categoryController';
import { authMiddleware } from "../midlleware/auth"
const router = express.Router();

router.use(authMiddleware);

router.post('/', categoryController.getCategories);
router.post('/clearCache', categoryController.clearAllCache);
router.post('/search', categoryController.searchCategories);
router.post('/subcategories', categoryController.getSubcategories);
router.post('/subcategories/search', categoryController.searchSubcategories);

export default router;