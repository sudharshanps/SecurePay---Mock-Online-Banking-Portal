import { Router } from 'express';
import { getMyAccount, getSummary } from '../controllers/accountController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMyAccount);
router.get('/summary', getSummary);

export default router;
