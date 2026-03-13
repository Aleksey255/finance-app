import { Router } from "express";
import { db } from "@workspace/db";
import { goalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateGoalBody, UpdateGoalBody, ContributeToGoalBody } from "@workspace/api-zod";

const router = Router();

function formatGoal(goal: any) {
  const target = Number(goal.targetAmount);
  const current = Number(goal.currentAmount);
  const progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  let monthlySuggestion: number | undefined;
  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const monthsLeft = Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + deadline.getMonth() - now.getMonth());
    const remaining = target - current;
    monthlySuggestion = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
  }

  return {
    ...goal,
    targetAmount: target,
    currentAmount: current,
    progressPercent: Math.round(progressPercent * 10) / 10,
    monthlySuggestion,
  };
}

router.get("/", async (_req, res) => {
  const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
  res.json(goals.map(formatGoal));
});

router.post("/", async (req, res) => {
  const body = CreateGoalBody.parse(req.body);
  const [goal] = await db.insert(goalsTable).values({
    name: body.name,
    targetAmount: String(body.targetAmount),
    currentAmount: String(body.currentAmount ?? 0),
    deadline: body.deadline,
    color: body.color ?? "#22c55e",
    icon: body.icon ?? "savings",
  }).returning();
  res.status(201).json(formatGoal(goal));
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateGoalBody.parse(req.body);
  const [goal] = await db.update(goalsTable).set({
    name: body.name,
    targetAmount: String(body.targetAmount),
    currentAmount: String(body.currentAmount ?? 0),
    deadline: body.deadline,
    color: body.color ?? "#22c55e",
    icon: body.icon ?? "savings",
  }).where(eq(goalsTable.id, id)).returning();
  if (!goal) return res.status(404).json({ error: "Not found" });
  res.json(formatGoal(goal));
});

router.post("/:id/contribute", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = ContributeToGoalBody.parse(req.body);
  const [existing] = await db.select().from(goalsTable).where(eq(goalsTable.id, id));
  if (!existing) return res.status(404).json({ error: "Not found" });
  const newAmount = Number(existing.currentAmount) + body.amount;
  const [goal] = await db.update(goalsTable).set({
    currentAmount: String(newAmount),
  }).where(eq(goalsTable.id, id)).returning();
  res.json(formatGoal(goal));
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.json({ success: true });
});

export default router;
