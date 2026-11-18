import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminAccounts,
  updateAccountStatus,
  getAuditLogs,
} from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(USER_ROLES.ADMIN));

router.get('/dashboard', getAdminDashboard);
router.get('/accounts', getAdminAccounts);
router.patch('/accounts/:id/status', updateAccountStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
