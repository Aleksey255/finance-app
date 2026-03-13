import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateCategoryBody, UpdateCategoryBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(categories);
});

router.post("/", async (req, res) => {
  const body = CreateCategoryBody.parse(req.body);
  const [category] = await db.insert(categoriesTable).values({
    name: body.name,
    type: body.type,
    color: body.color,
    icon: body.icon,
    isDefault: false,
  }).returning();
  res.status(201).json(category);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateCategoryBody.parse(req.body);
  const [category] = await db.update(categoriesTable).set({
    name: body.name,
    type: body.type,
    color: body.color,
    icon: body.icon,
  }).where(eq(categoriesTable.id, id)).returning();
  if (!category) return res.status(404).json({ error: "Not found" });
  res.json(category);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ success: true });
});

export default router;
