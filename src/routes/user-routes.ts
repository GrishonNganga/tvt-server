// src/routes/userRoutes.ts
import { Router } from 'express';
import * as userController from '../controllers/user-conroller';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', userController.getAllUsers);
router.get('/:id', requireAdmin, userController.getUserById);
router.post('/', requireAdmin, userController.createUser);

export default router;
