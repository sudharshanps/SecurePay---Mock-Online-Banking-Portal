import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import LedgerEntry from '../models/LedgerEntry.js';
import { logAudit } from '../services/auditService.js';
import { maskAccountNumber, formatINR, paiseToRupees, AUDIT_ACTIONS } from '../config/constants.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const account = await BankAccount.findOne({ userId: req.user._id });

    // Recent 5 activities
    const recentActivity = await LedgerEntry.find({ accountId: account?._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('transferId', 'referenceId');

    res.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      account: account
        ? {
            id: account._id,
            accountNumber: account.accountNumber,
            maskedAccountNumber: maskAccountNumber(account.accountNumber),
            accountType: account.accountType,
            status: account.status,
            balancePaise: account.balancePaise,
            balanceRupees: paiseToRupees(account.balancePaise),
            formattedBalance: formatINR(account.balancePaise),
            createdAt: account.createdAt,
          }
        : null,
      recentActivity: recentActivity.map((act) => ({
        id: act._id,
        referenceId: act.transferId?.referenceId || 'N/A',
        entryType: act.entryType,
        amount: formatINR(act.amountPaise),
        description: act.description,
        date: act.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const user = await User.findById(req.user._id);

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'This email address is already in use by another account.',
        });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    await logAudit({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: AUDIT_ACTIONS.PROFILE_UPDATED,
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { updatedFields: { name: !!name, phone: !!phone, email: !!email } },
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await logAudit({
        actorId: user._id,
        actorEmail: user.email,
        action: 'PASSWORD_CHANGE_FAILED',
        resourceType: 'User',
        resourceId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { reason: 'Incorrect current password' },
        result: 'FAILURE',
      });
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    // Verify not identical to current
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to the current password.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logAudit({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please keep your new credentials safe.',
    });
  } catch (error) {
    next(error);
  }
};
