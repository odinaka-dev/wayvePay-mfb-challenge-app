import * as z from "zod";

const minor = z.number().int();

// user - data
export const accountSchema = z.object({
  accountId: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  currency: z.string(),
  availableBalanceMinor: minor,
});
export type userDataParams = z.infer<typeof accountSchema>;

// transaction history
export const transactionTypes = ["debit", "credit"] as const;
export type transactionType = (typeof transactionTypes)[number];

export const transactionStatuses = ["successful", "pending", "failed", "reversed"] as const;
export type transactionStatus = (typeof transactionStatuses)[number];

export const transactionSchema = z.object({
  id: z.string().min(1),
  reference: z.string(),
  amountMinor: minor.nonnegative(),
  currency: z.string(),
  type: z.enum(transactionTypes),
  status: z.enum(transactionStatuses),
  description: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  // Debits have a recipient, credits have a sender. Bank details are not always supplied.
  recipient: z
    .object({
      name: z.string(),
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
    })
    .optional(),
  sender: z.object({ name: z.string() }).optional(),
  // Only present where the API supplies it.
  feeMinor: minor.nonnegative().optional(),
});
export type transactionParams = z.infer<typeof transactionSchema>;

export const transactionHistorySchema = z.object({
  items: z.array(transactionSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  hasMore: z.boolean(),
});
export type transactionHistoryParams = z.infer<typeof transactionHistorySchema>;

// transfers
export interface transferParams {
  recipientBankCode: string;
  recipientAccountNumber: string;
  amountMinor: number;
  narration: string;
  idempotencyKey: string;
}

export interface transferResolve {
  bankCode: string;
  accountNumber: string;
}

export const bankSchema = z.object({ bankCode: z.string(), bankName: z.string() });
export type BankParams = z.infer<typeof bankSchema>;
export const banksResponseSchema = z.object({ items: z.array(bankSchema) });

export const resolvedAccountSchema = z.object({
  accountName: z.string(),
  bankCode: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
});
export type resolvedAccountParams = z.infer<typeof resolvedAccountSchema>;

export const transferStatuses = ["successful", "pending", "failed"] as const;
export type transferStatus = (typeof transferStatuses)[number];

export const transferStatusSchema = z.object({
  transactionId: z.string().min(1),
  reference: z.string(),
  status: z.enum(transferStatuses),
  amountMinor: minor.nonnegative(),
  currency: z.string(),
  recipientBankCode: z.string(),
  recipientAccountNumber: z.string(),
  recipientName: z.string(),
  feeMinor: minor.nonnegative(),
  totalDebitMinor: minor.nonnegative(),
  narration: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type transferStatusParams = z.infer<typeof transferStatusSchema>;
