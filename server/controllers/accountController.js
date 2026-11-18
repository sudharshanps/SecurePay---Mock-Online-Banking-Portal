import { getAccountByUserId, getAccountSummary } from '../services/accountService.js';

export const getMyAccount = async (req, res, next) => {
  try {
    const account = await getAccountByUserId(req.user._id);
    res.json({
      success: true,
      account,
    });
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req, res, next) => {
  try {
    const summary = await getAccountSummary(req.user._id);
    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};
