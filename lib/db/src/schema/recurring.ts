import { pgTable, serial, text, numeric, integer, boolean, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { accountsTable } from "./accounts";
import { categoriesTable } from "./categories";

export const frequencyEnum = pgEnum("frequency_type", ["daily", "weekly", "monthly", "yearly"]);

export const recurringTransactionsTable = pgTable("recurring_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  accountId: integer("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  description: text("description").notNull(),
  frequency: frequencyEnum("frequency").notNull(),
  dayOfMonth: integer("day_of_month"),
  nextDate: date("next_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecurringSchema = createInsertSchema(recurringTransactionsTable).omit({ id: true, createdAt: true });
export type InsertRecurring = z.infer<typeof insertRecurringSchema>;
export type RecurringTransaction = typeof recurringTransactionsTable.$inferSelect;
