// src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user-routes';
import authRoutes from './auth-routes';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = Router();

router.use('/auth', authRoutes);
// Protect user routes with authentication
router.use('/users', authenticate, userRoutes);

export default router;
