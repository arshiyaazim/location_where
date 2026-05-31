import { Router } from 'express';
import * as locationController from './location.controller';
import { authAdmin, authEmployee } from '../../middleware/auth.middleware';
import { locationLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.post('/update', authEmployee, locationLimiter, locationController.updateLocation);
router.get('/live', authAdmin, locationController.getLive);
router.get('/:employeeId/history', authAdmin, locationController.getEmployeeHistory);

export default router;
