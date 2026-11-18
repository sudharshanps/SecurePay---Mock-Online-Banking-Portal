import { z } from 'zod';

export const verifyRecipientSchema = z.object({
  recipientAccountNumber: z
    .string()
    .trim()
    .min(6, 'Account number must be at least 6 digits')
    .max(20, 'Account number cannot exceed 20 digits'),
});

export const createTransferSchema = z.object({
  recipientAccountNumber: z
    .string()
    .trim()
    .min(6, 'Account number must be at least 6 digits')
    .max(20, 'Account number cannot exceed 20 digits'),
  amount: z
    .union([z.number(), z.string()])
    .refine((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num > 0;
    }, { message: 'Transfer amount must be greater than zero' }),
  description: z
    .string()
    .trim()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .default('Mock Fund Transfer'),
  idempotencyKey: z
    .string()
    .trim()
    .max(100)
    .optional(),
});
