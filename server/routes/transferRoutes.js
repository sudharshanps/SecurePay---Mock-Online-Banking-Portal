import { Router } from 'express';
import {
  verifyRecipient,
  initiateTransfer,
  getReceipt,
} from '../controllers/transferController.js';
import { authenticate, requireActiveAccount } from '../middleware/auth.js';
import { transferLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import {
  verifyRecipientSchema,
  createTransferSchema,
} from '../validators/transferValidator.js';

const router = Router();

router.use(authenticate);

router.post('/verify-recipient', requireActiveAccount, validateBody(verifyRecipientSchema), verifyRecipient);
router.post('/', requireActiveAccount, transferLimiter, validateBody(createTransferSchema), initiateTransfer);
router.get('/:id/receipt', getReceipt);

export default router;
