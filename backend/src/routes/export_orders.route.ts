import { Router } from "express";
import * as exportOrderController from "../controllers/export_orders.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission('exportOrders_view'), exportOrderController.index);

export const exportOrderRoutes = router;
