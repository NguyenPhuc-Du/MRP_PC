import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission("dashboard_view"), dashboardController.index);
router.get(
  "/export.xlsx",
  requirePermission("dashboard_view"),
  dashboardController.exportExcel,
);
router.get(
  "/export.pdf",
  requirePermission("dashboard_view"),
  dashboardController.exportPdf,
);

export const dashboardRoutes = router;
