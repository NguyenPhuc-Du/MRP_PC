import { Router } from "express";
import * as authController from "./auth.api.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import * as productionController from "./production.api.controller";

const router = Router();

router.post("/auth/login", authController.login);

router.get(
  "/auth/me",
  authenticateToken,
  requireRole("staff"),
  authController.me,
);

router.get(
  "/production-orders/me",
  authenticateToken,
  requireRole("staff"),
  productionController.getMyOders,
);

router.get(
  "/production-orders/:id/stock",
  authenticateToken,
  requireRole("staff"),
  productionController.getOrderStock,
);

router.get(
  "/production-orders/:id/assemble",
  authenticateToken,
  requireRole("staff"),
  productionController.getAssembleStatus,
);

router.post(
  "/production-orders/:id/request-material",
  authenticateToken,
  requireRole("staff"),
  productionController.requestMaterialExport,
);

router.post(
  "/production-orders/:id/confirm",
  authenticateToken,
  requireRole("staff"),
  productionController.confirmAssemble,
);

router.post(
  "/production-orders/:id/request-product",
  authenticateToken,
  requireRole("staff"),
  productionController.requestProductExport,
);

router.get(
  "/production-orders/:id",
  authenticateToken,
  requireRole("staff"),
  productionController.getMyOrderById,
);

export default router;
