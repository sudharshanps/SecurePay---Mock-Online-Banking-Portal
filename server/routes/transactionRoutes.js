import { Router } from 'express';
import {
  listTransactions,
  getTransaction,
  getStatement,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listTransactions);
router.get('/statement', getStatement);
router.get('/:id', getTransaction);

export default router;
