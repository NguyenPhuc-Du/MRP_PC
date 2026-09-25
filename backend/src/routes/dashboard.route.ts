import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission("dashboard_view"), dashboardController.index);

export const dashboardRoutes = router;
