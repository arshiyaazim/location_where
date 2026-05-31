import { Router } from 'express';
import * as deviceController from './device.controller';
import { authAdmin } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

const router = Router();

router.post('/remote-lock', authAdmin, requireRole('SUPER_ADMIN', 'SECURITY_OFFICER'), deviceController.lockDevice);

export default router;
