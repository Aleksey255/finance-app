import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accounts from "./accounts";
import categories from "./categories";
import transactions from "./transactions";
import budgets from "./budgets";
import goals from "./goals";
import analytics from "./analytics";
import recurring from "./recurring";
import transfers from "./transfers";
import calendar from "./calendar";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/accounts", accounts);
router.use("/categories", categories);
router.use("/transactions", transactions);
router.use("/budgets", budgets);
router.use("/goals", goals);
router.use("/analytics", analytics);
router.use("/recurring", recurring);
router.use("/transfers", transfers);
router.use("/calendar", calendar);

export default router;
