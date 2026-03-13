import { z } from "zod";

export const CreateTransactionBodyFixed = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number(),
  accountId: z.number(),
  categoryId: z.number(),
  subcategory: z.string().optional(),
  date: z.string(),
  comment: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const UpdateTransactionBodyFixed = CreateTransactionBodyFixed;

export const CreateTransferBodyFixed = z.object({
  fromAccountId: z.number(),
  toAccountId: z.number(),
  amount: z.number(),
  date: z.string(),
  comment: z.string().optional(),
});

export const CreateRecurringBodyFixed = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number(),
  accountId: z.number(),
  categoryId: z.number(),
  description: z.string(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  dayOfMonth: z.number().optional(),
  startDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateRecurringBodyFixed = CreateRecurringBodyFixed;

export const CreateGoalBodyFixed = z.object({
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number().optional(),
  deadline: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const UpdateGoalBodyFixed = CreateGoalBodyFixed;

export const ContributeToGoalBodyFixed = z.object({
  amount: z.number(),
});
