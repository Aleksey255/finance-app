import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, accountsTable, categoriesTable } from "@workspace/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const now = new Date();
  const year = parseInt((req.query.year as string) ?? String(now.getFullYear()));
  const month = parseInt((req.query.month as string) ?? String(now.getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

  const [accounts, monthTotals, prevMonthTotals, topCategories] = await Promise.all([
    db.select().from(accountsTable),
    db.select({
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
    }).from(transactionsTable).where(and(
      gte(transactionsTable.date, startDate),
      lte(transactionsTable.date, endDate),
    )).groupBy(transactionsTable.type),
    db.select({
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
    }).from(transactionsTable).where(and(
      gte(transactionsTable.date, prevStartDate),
      lte(transactionsTable.date, prevEndDate),
    )).groupBy(transactionsTable.type),
    db.select({
      categoryId: transactionsTable.categoryId,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
      count: sql<number>`count(*)::int`,
    }).from(transactionsTable).where(and(
      eq(transactionsTable.type, "expense"),
      gte(transactionsTable.date, startDate),
      lte(transactionsTable.date, endDate),
    )).groupBy(transactionsTable.categoryId)
      .orderBy(sql`sum(${transactionsTable.amount}::numeric) desc`)
      .limit(5),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);
  const accountBalances = accounts.map(a => ({
    accountId: a.id,
    accountName: a.name,
    balance: Number(a.currentBalance),
    currency: a.currency,
  }));

  let monthIncome = 0;
  let monthExpense = 0;
  for (const t of monthTotals) {
    if (t.type === "income") monthIncome = Number(t.total);
    if (t.type === "expense") monthExpense = Number(t.total);
  }

  let previousMonthIncome = 0;
  let previousMonthExpense = 0;
  for (const t of prevMonthTotals) {
    if (t.type === "income") previousMonthIncome = Number(t.total);
    if (t.type === "expense") previousMonthExpense = Number(t.total);
  }

  const totalExpense = topCategories.reduce((sum, c) => sum + Number(c.total), 0);
  const topExpenseCategories = await Promise.all(topCategories.map(async (c) => {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, c.categoryId));
    return {
      categoryId: c.categoryId,
      categoryName: cat?.name ?? "Unknown",
      categoryColor: cat?.color ?? "#6366f1",
      categoryIcon: cat?.icon ?? "category",
      total: Number(c.total),
      count: c.count,
      percentage: totalExpense > 0 ? Math.round((Number(c.total) / totalExpense) * 100) : 0,
    };
  }));

  const projectedBalance = totalBalance + (monthIncome - monthExpense);

  res.json({
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    previousMonthIncome,
    previousMonthExpense,
    accountBalances,
    topExpenseCategories,
    projectedBalance,
  });
});

router.get("/by-category", async (req, res) => {
  const { startDate, endDate, type } = req.query as Record<string, string>;

  const conditions: any[] = [];
  if (startDate) conditions.push(gte(transactionsTable.date, startDate));
  if (endDate) conditions.push(lte(transactionsTable.date, endDate));
  if (type) conditions.push(eq(transactionsTable.type, type as "income" | "expense"));

  const rows = await db.select({
    categoryId: transactionsTable.categoryId,
    total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
    count: sql<number>`count(*)::int`,
  }).from(transactionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(transactionsTable.categoryId)
    .orderBy(sql`sum(${transactionsTable.amount}::numeric) desc`);

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);

  const result = await Promise.all(rows.map(async (r) => {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, r.categoryId));
    return {
      categoryId: r.categoryId,
      categoryName: cat?.name ?? "Unknown",
      categoryColor: cat?.color ?? "#6366f1",
      categoryIcon: cat?.icon ?? "category",
      total: Number(r.total),
      count: r.count,
      percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 100) : 0,
    };
  }));

  res.json(result);
});

router.get("/monthly-trend", async (req, res) => {
  const months = parseInt((req.query.months as string) ?? "12");
  const now = new Date();

  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const totals = await db.select({
      type: transactionsTable.type,
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
    }).from(transactionsTable).where(and(
      gte(transactionsTable.date, startDate),
      lte(transactionsTable.date, endDate),
    )).groupBy(transactionsTable.type);

    let income = 0;
    let expense = 0;
    for (const t of totals) {
      if (t.type === "income") income = Number(t.total);
      if (t.type === "expense") expense = Number(t.total);
    }

    result.push({ year, month, income, expense, net: income - expense });
  }

  res.json(result);
});

router.get("/daily-average", async (_req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const daysInMonth = lastDay;

  const [result] = await db.select({
    total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
  }).from(transactionsTable).where(and(
    eq(transactionsTable.type, "expense"),
    gte(transactionsTable.date, startDate),
    lte(transactionsTable.date, endDate),
  ));

  const totalExpense = Number(result?.total ?? 0);
  const average = daysInMonth > 0 ? totalExpense / daysInMonth : 0;

  res.json({ average: Math.round(average * 100) / 100, daysInMonth, totalExpense });
});

router.get("/export", async (req, res) => {
  const { startDate, endDate } = req.query as Record<string, string>;

  const conditions: any[] = [];
  if (startDate) conditions.push(gte(transactionsTable.date, startDate));
  if (endDate) conditions.push(lte(transactionsTable.date, endDate));

  const txs = await db.select({
    transaction: transactionsTable,
    account: accountsTable,
    category: categoriesTable,
  })
    .from(transactionsTable)
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(transactionsTable.date);

  const header = "Date,Type,Amount,Account,Category,Subcategory,Comment\n";
  const rows = txs.map(({ transaction, account, category }) =>
    `${transaction.date},${transaction.type},${transaction.amount},"${account?.name ?? ""}","${category?.name ?? ""}","${transaction.subcategory ?? ""}","${(transaction.comment ?? "").replace(/"/g, '""')}"`
  ).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(header + rows);
});

export default router;
