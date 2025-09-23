import express from 'express';
import { register, login, getMe, updatePassword, refreshToken, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 公開路由
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// 保護路由
router.get('/me', authenticate, getMe);
router.put('/update-password', authenticate, updatePassword);
router.post('/logout', authenticate, logout);

export default router;