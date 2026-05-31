import { Router } from 'express';
import * as authController from './auth.controller';
import { loginLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.post('/login', loginLimiter, authController.login);
router.post('/mobile/login', loginLimiter, authController.initiateMobileLogin);
router.post('/verify-otp', loginLimiter, authController.verifyOTP);
router.post('/logout', authController.logout);

export default router;
