import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, categoriesTable, recurringTransactionsTable } from "@workspace/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const now = new Date();
  const year = parseInt((req.query.year as string) ?? String(now.getFullYear()));
  const month = parseInt((req.query.month as string) ?? String(now.getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const txs = await db.select({
    transaction: transactionsTable,
    category: categoriesTable,
  })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(and(
      gte(transactionsTable.date, startDate),
      lte(transactionsTable.date, endDate),
    ));

  const recurring = await db.select({
    recurring: recurringTransactionsTable,
    category: categoriesTable,
  })
    .from(recurringTransactionsTable)
    .leftJoin(categoriesTable, eq(recurringTransactionsTable.categoryId, categoriesTable.id))
    .where(eq(recurringTransactionsTable.isActive, true));

  const dayMap: Record<string, any[]> = {};

  for (const { transaction, category } of txs) {
    const date = transaction.date;
    if (!dayMap[date]) dayMap[date] = [];
    dayMap[date].push({
      id: transaction.id,
      type: "transaction",
      transactionType: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.comment ?? category?.name ?? "Transaction",
      categoryColor: category?.color,
      categoryIcon: category?.icon,
    });
  }

  for (const { recurring: rec, category } of recurring) {
    if (!rec.nextDate) continue;
    const recDate = new Date(rec.nextDate);
    if (recDate.getFullYear() === year && recDate.getMonth() + 1 === month) {
      const dateStr = rec.nextDate;
      if (!dayMap[dateStr]) dayMap[dateStr] = [];
      dayMap[dateStr].push({
        id: rec.id,
        type: "recurring",
        transactionType: rec.type,
        amount: Number(rec.amount),
        description: rec.description,
        categoryColor: category?.color,
        categoryIcon: category?.icon,
      });
    }
  }

  const result = Object.entries(dayMap).map(([date, events]) => ({ date, events })).sort((a, b) => a.date.localeCompare(b.date));

  res.json(result);
});

export default router;
