import {
  verifyRecipient as verifyRecipientService,
  executeTransfer as executeTransferService,
  getTransferReceipt as getTransferReceiptService,
} from '../services/transferService.js';

export const verifyRecipient = async (req, res, next) => {
  try {
    const { recipientAccountNumber } = req.body;
    const result = await verifyRecipientService(recipientAccountNumber, req.user._id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const initiateTransfer = async (req, res, next) => {
  try {
    const { recipientAccountNumber, amount, description } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const receipt = await executeTransferService({
      senderUserId: req.user._id,
      recipientAccountNumber,
      amount,
      description,
      idempotencyKey,
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      success: true,
      message: 'Transfer processed successfully.',
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

export const getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const receipt = await getTransferReceiptService(id, req.user._id);

    res.json({
      success: true,
      receipt,
    });
  } catch (error) {
    next(error);
  }
};
