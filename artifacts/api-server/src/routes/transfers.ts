import { Router } from "express";
import { db } from "@workspace/db";
import { transfersTable, accountsTable, transactionsTable } from "@workspace/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { CreateTransferBody } from "@workspace/api-zod";

const router = Router();

async function updateAccountBalance(accountId: number) {
  const result = await db.select({
    income: sql<number>`coalesce(sum(case when type = 'income' then amount::numeric else 0 end), 0)`,
    expense: sql<number>`coalesce(sum(case when type = 'expense' then amount::numeric else 0 end), 0)`,
  }).from(transactionsTable).where(and(eq(transactionsTable.accountId, accountId), eq(transactionsTable.isTransfer, false)));

  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, accountId));
  if (!account) return;

  const initialBalance = Number(account.initialBalance);
  const income = Number(result[0]?.income ?? 0);
  const expense = Number(result[0]?.expense ?? 0);
  const currentBalance = initialBalance + income - expense;

  await db.update(accountsTable).set({ currentBalance: String(currentBalance) }).where(eq(accountsTable.id, accountId));
}

router.post("/", async (req, res) => {
  const body = CreateTransferBody.parse(req.body);

  const transferCategoryId = 13;
  await db.insert(transactionsTable).values([
    {
      type: "expense",
      amount: String(body.amount),
      accountId: body.fromAccountId,
      categoryId: transferCategoryId,
      date: body.date,
      comment: body.comment ?? `Transfer to account ${body.toAccountId}`,
      isTransfer: true,
    },
    {
      type: "income",
      amount: String(body.amount),
      accountId: body.toAccountId,
      categoryId: transferCategoryId,
      date: body.date,
      comment: body.comment ?? `Transfer from account ${body.fromAccountId}`,
      isTransfer: true,
    },
  ]);

  const [transfer] = await db.insert(transfersTable).values({
    fromAccountId: body.fromAccountId,
    toAccountId: body.toAccountId,
    amount: String(body.amount),
    date: body.date,
    comment: body.comment,
  }).returning();

  await Promise.all([
    updateAccountBalance(body.fromAccountId),
    updateAccountBalance(body.toAccountId),
  ]);

  res.status(201).json({ ...transfer, amount: Number(transfer.amount) });
});

export default router;
