import { Router } from 'express';
import * as employeeController from './employee.controller';
import { authAdmin, authEmployee } from '../../middleware/auth.middleware';
import { requireRole, branchFilter } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authAdmin, branchFilter, employeeController.getEmployees);
router.post('/', authAdmin, requireRole('SUPER_ADMIN', 'HR_MANAGER'), employeeController.createEmployee);
router.post('/:id/consent', authEmployee, employeeController.submitConsent);

export default router;
