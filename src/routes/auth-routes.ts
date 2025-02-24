// src/routes/authRoutes.ts
import { Router } from 'express';
import * as authController from '../controllers/auth-controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);


export default router;
