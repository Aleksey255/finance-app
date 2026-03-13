import { Router } from "express";
import { db } from "@workspace/db";
import { recurringTransactionsTable, accountsTable, categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateRecurringTransactionBody, UpdateRecurringTransactionBody } from "@workspace/api-zod";

const router = Router();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getNextDate(frequency: string, dayOfMonth?: number | null, startDate?: string): string {
  const now = new Date();
  const start = startDate ? new Date(startDate) : now;
  
  switch (frequency) {
    case "daily": {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      return next.toISOString().split("T")[0];
    }
    case "weekly": {
      const next = new Date(now);
      next.setDate(next.getDate() + 7);
      return next.toISOString().split("T")[0];
    }
    case "monthly": {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth ?? start.getDate());
      return next.toISOString().split("T")[0];
    }
    case "yearly": {
      const next = new Date(now.getFullYear() + 1, start.getMonth(), start.getDate());
      return next.toISOString().split("T")[0];
    }
    default:
      return new Date(now.setMonth(now.getMonth() + 1)).toISOString().split("T")[0];
  }
}

router.get("/", async (_req, res) => {
  const rows = await db.select({
    recurring: recurringTransactionsTable,
    account: accountsTable,
    category: categoriesTable,
  })
    .from(recurringTransactionsTable)
    .leftJoin(accountsTable, eq(recurringTransactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(recurringTransactionsTable.categoryId, categoriesTable.id))
    .orderBy(recurringTransactionsTable.createdAt);

  res.json(rows.map(({ recurring, account, category }) => ({
    ...recurring,
    amount: Number(recurring.amount),
    account: account ? { ...account, initialBalance: Number(account.initialBalance), currentBalance: Number(account.currentBalance) } : undefined,
    category: category ?? undefined,
  })));
});

router.post("/", async (req, res) => {
  const body = CreateRecurringTransactionBody.parse(req.body);
  const nextDate = getNextDate(body.frequency, body.dayOfMonth, body.startDate);
  
  const [recurring] = await db.insert(recurringTransactionsTable).values({
    type: body.type,
    amount: String(body.amount),
    accountId: body.accountId,
    categoryId: body.categoryId,
    description: body.description,
    frequency: body.frequency,
    dayOfMonth: body.dayOfMonth,
    nextDate,
    isActive: body.isActive ?? true,
  }).returning();

  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, recurring.accountId));
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, recurring.categoryId));

  res.status(201).json({
    ...recurring,
    amount: Number(recurring.amount),
    account: account ? { ...account, initialBalance: Number(account.initialBalance), currentBalance: Number(account.currentBalance) } : undefined,
    category: category ?? undefined,
  });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateRecurringTransactionBody.parse(req.body);
  const nextDate = getNextDate(body.frequency, body.dayOfMonth, body.startDate);
  
  const [recurring] = await db.update(recurringTransactionsTable).set({
    type: body.type,
    amount: String(body.amount),
    accountId: body.accountId,
    categoryId: body.categoryId,
    description: body.description,
    frequency: body.frequency,
    dayOfMonth: body.dayOfMonth,
    nextDate,
    isActive: body.isActive ?? true,
  }).where(eq(recurringTransactionsTable.id, id)).returning();
  
  if (!recurring) return res.status(404).json({ error: "Not found" });

  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, recurring.accountId));
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, recurring.categoryId));

  res.json({
    ...recurring,
    amount: Number(recurring.amount),
    account: account ? { ...account, initialBalance: Number(account.initialBalance), currentBalance: Number(account.currentBalance) } : undefined,
    category: category ?? undefined,
  });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(recurringTransactionsTable).where(eq(recurringTransactionsTable.id, id));
  res.json({ success: true });
});

export default router;
