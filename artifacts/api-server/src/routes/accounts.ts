import { Router } from "express";
import { db } from "@workspace/db";
import { accountsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateAccountBody,
  UpdateAccountBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const accounts = await db.select().from(accountsTable).orderBy(accountsTable.createdAt);
  res.json(accounts.map(a => ({
    ...a,
    initialBalance: Number(a.initialBalance),
    currentBalance: Number(a.currentBalance),
  })));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, id));
  if (!account) return res.status(404).json({ error: "Not found" });
  res.json({ ...account, initialBalance: Number(account.initialBalance), currentBalance: Number(account.currentBalance) });
});

router.post("/", async (req, res) => {
  const body = CreateAccountBody.parse(req.body);
  const [account] = await db.insert(accountsTable).values({
    name: body.name,
    type: body.type,
    currency: body.currency,
    initialBalance: String(body.initialBalance),
    currentBalance: String(body.initialBalance),
    color: body.color ?? "#6366f1",
    icon: body.icon ?? "account_balance_wallet",
  }).returning();
  res.status(201).json({ ...account, initialBalance: Number(account.initialBalance), currentBalance: Number(account.currentBalance) });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateAccountBody.parse(req.body);
  const [account] = await db.update(accountsTable).set({
    name: body.name,
    type: body.type,
    currency: body.currency,
    initialBalance: String(body.initialBalance),
    color: body.color ?? "#6366f1",
    icon: body.icon ?? "account_balance_wallet",
  }).where(eq(accountsTable.id, id)).returning();
  if (!account) return res.status(404).json({ error: "Not found" });
  res.json({ ...account, initialBalance: Number(account.initialBalance), currentBalance: Number(account.currentBalance) });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(accountsTable).where(eq(accountsTable.id, id));
  res.json({ success: true });
});

export default router;
