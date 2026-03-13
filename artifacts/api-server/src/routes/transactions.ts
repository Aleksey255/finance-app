import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { CreateTransactionBody, UpdateTransactionBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const { accountId, categoryId, type, startDate, endDate, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions: any[] = [];
  if (accountId) conditions.push(eq(transactionsTable.accountId, parseInt(accountId)));
  if (categoryId) conditions.push(eq(transactionsTable.categoryId, parseInt(categoryId)));
  if (type && (type === "income" || type === "expense")) conditions.push(eq(transactionsTable.type, type));
  if (startDate) conditions.push(gte(transactionsTable.date, startDate));
  if (endDate) conditions.push(lte(transactionsTable.date, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [txs, countResult] = await Promise.all([
    db.select({
      transaction: transactionsTable,
      account: accountsTable,
      category: categoriesTable,
    })
      .from(transactionsTable)
      .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(whereClause)
      .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset)),
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(whereClause),
  ]);

  const totals = await db.select({
    type: transactionsTable.type,
    total: sql<number>`sum(amount::numeric)`,
  }).from(transactionsTable).where(whereClause).groupBy(transactionsTable.type);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of totals) {
    if (t.type === "income") totalIncome = Number(t.total);
    if (t.type === "expense") totalExpense = Number(t.total);
  }

  const transactions = txs.map(({ transaction, account, category }) => ({
    ...transaction,
    amount: Number(transaction.amount),
    account: account ? { ...account, initialBalance: Number(account.initialBalance), currentBalance: Number(account.currentBalance) } : undefined,
    category: category ?? undefined,
  }));

  res.json({
    transactions,
    total: countResult[0]?.count ?? 0,
    totalIncome,
    totalExpense,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.select({
    transaction: transactionsTable,
    account: accountsTable,
    category: categoriesTable,
  })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.id, id));
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({
    ...row.transaction,
    amount: Number(row.transaction.amount),
    account: row.account ? { ...row.account, initialBalance: Number(row.account.initialBalance), currentBalance: Number(row.account.currentBalance) } : undefined,
    category: row.category ?? undefined,
  });
});

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
  const body = CreateTransactionBody.parse(req.body);
  const [transaction] = await db.insert(transactionsTable).values({
    type: body.type,
    amount: String(body.amount),
    accountId: body.accountId,
    categoryId: body.categoryId,
    subcategory: body.subcategory,
    date: body.date,
    comment: body.comment,
    receiptUrl: body.receiptUrl,
    isTransfer: false,
  }).returning();
  
  await updateAccountBalance(body.accountId);
  
  const [row] = await db.select({
    transaction: transactionsTable,
    account: accountsTable,
    category: categoriesTable,
  })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.id, transaction.id));
  
  res.status(201).json({
    ...row.transaction,
    amount: Number(row.transaction.amount),
    account: row.account ? { ...row.account, initialBalance: Number(row.account.initialBalance), currentBalance: Number(row.account.currentBalance) } : undefined,
    category: row.category ?? undefined,
  });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateTransactionBody.parse(req.body);
  const [old] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  
  await db.update(transactionsTable).set({
    type: body.type,
    amount: String(body.amount),
    accountId: body.accountId,
    categoryId: body.categoryId,
    subcategory: body.subcategory,
    date: body.date,
    comment: body.comment,
    receiptUrl: body.receiptUrl,
  }).where(eq(transactionsTable.id, id));
  
  await updateAccountBalance(body.accountId);
  if (old && old.accountId !== body.accountId) {
    await updateAccountBalance(old.accountId);
  }
  
  const [row] = await db.select({
    transaction: transactionsTable,
    account: accountsTable,
    category: categoriesTable,
  })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(eq(transactionsTable.id, id));
  if (!row) return res.status(404).json({ error: "Not found" });
  
  res.json({
    ...row.transaction,
    amount: Number(row.transaction.amount),
    account: row.account ? { ...row.account, initialBalance: Number(row.account.initialBalance), currentBalance: Number(row.account.currentBalance) } : undefined,
    category: row.category ?? undefined,
  });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
  if (tx) await updateAccountBalance(tx.accountId);
  res.json({ success: true });
});

export default router;
