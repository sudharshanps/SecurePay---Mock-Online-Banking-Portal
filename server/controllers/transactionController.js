import {
  getTransactions as getTransactionsService,
  getTransactionById as getTransactionByIdService,
  getAccountStatement as getAccountStatementService,
} from '../services/transactionService.js';

export const listTransactions = async (req, res, next) => {
  try {
    const result = await getTransactionsService(req.user._id, req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await getTransactionByIdService(req.user._id, id);
    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const statement = await getAccountStatementService(req.user._id, { startDate, endDate });
    res.json({
      success: true,
      statement,
    });
  } catch (error) {
    next(error);
  }
};
