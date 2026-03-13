import { Router } from "express";
import { db } from "@workspace/db";
import { budgetsTable, categoriesTable, transactionsTable } from "@workspace/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { CreateBudgetBody, UpdateBudgetBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const now = new Date();
  const year = parseInt((req.query.year as string) ?? String(now.getFullYear()));
  const month = parseInt((req.query.month as string) ?? String(now.getMonth() + 1));

  const budgets = await db.select({
    budget: budgetsTable,
    category: categoriesTable,
  })
    .from(budgetsTable)
    .leftJoin(categoriesTable, eq(budgetsTable.categoryId, categoriesTable.id))
    .where(and(eq(budgetsTable.year, year), eq(budgetsTable.month, month)));

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

  const result = await Promise.all(budgets.map(async ({ budget, category }) => {
    const [spendRow] = await db.select({
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
    }).from(transactionsTable).where(and(
      eq(transactionsTable.categoryId, budget.categoryId),
      eq(transactionsTable.type, "expense"),
      gte(transactionsTable.date, startDate),
      lte(transactionsTable.date, endDate),
    ));

    const [prevSpendRow] = await db.select({
      total: sql<number>`coalesce(sum(${transactionsTable.amount}::numeric), 0)`,
    }).from(transactionsTable).where(and(
      eq(transactionsTable.categoryId, budget.categoryId),
      eq(transactionsTable.type, "expense"),
      gte(transactionsTable.date, prevStartDate),
      lte(transactionsTable.date, prevEndDate),
    ));

    return {
      ...budget,
      amount: Number(budget.amount),
      spent: Number(spendRow?.total ?? 0),
      previousMonthSpent: Number(prevSpendRow?.total ?? 0),
      category,
    };
  }));

  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CreateBudgetBody.parse(req.body);
  const [budget] = await db.insert(budgetsTable).values({
    categoryId: body.categoryId,
    amount: String(body.amount),
    year: body.year,
    month: body.month,
  }).returning();
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, budget.categoryId));
  res.status(201).json({ ...budget, amount: Number(budget.amount), category });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateBudgetBody.parse(req.body);
  const [budget] = await db.update(budgetsTable).set({
    categoryId: body.categoryId,
    amount: String(body.amount),
    year: body.year,
    month: body.month,
  }).where(eq(budgetsTable.id, id)).returning();
  if (!budget) return res.status(404).json({ error: "Not found" });
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, budget.categoryId));
  res.json({ ...budget, amount: Number(budget.amount), category });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(budgetsTable).where(eq(budgetsTable.id, id));
  res.json({ success: true });
});

export default router;
