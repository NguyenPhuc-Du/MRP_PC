import { Router } from "express";
import * as exportOrderController from "../controllers/export_orders.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission("exportOrders_view"), exportOrderController.index);
router.post(
  "/:orderId/approve",
  requirePermission("exportOrders_approve"),
  exportOrderController.approve,
);
router.post(
  "/:orderId/reject",
  requirePermission("exportOrders_approve"),
  exportOrderController.reject,
);
router.get(
  "/:orderId",
  requirePermission("exportOrders_view"),
  exportOrderController.detail,
);

export const exportOrderRoutes = router;
