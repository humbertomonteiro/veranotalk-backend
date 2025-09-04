import { Router } from "express";
import { TransactionController } from "../http/controllers";
import { TransactionService } from "../http/services";
import { FirebaseTransactionRepository } from "../repositories";

const router = Router();
const transactionService = new TransactionService(
  new FirebaseTransactionRepository()
);
const controller = new TransactionController(transactionService);

router.post("", controller.createTransaction.bind(controller));
router.get("/:id", controller.getTransactionById.bind(controller));
router.put("/:id", controller.updateTransaction.bind(controller));
router.delete("/:id", controller.deleteTransaction.bind(controller));
router.get("", controller.getAllTransactions.bind(controller));
router.get(
  "/category/:category",
  controller.getTransactionsByCategory.bind(controller)
);
router.get("/period", controller.getTransactionsByPeriod.bind(controller));
router.get("/cashflow/summary", controller.getCashFlowSummary.bind(controller));
router.get("/cashflow/period", controller.getCashFlowByPeriod.bind(controller));

export { router as transactionRoutes };
