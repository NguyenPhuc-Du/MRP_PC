import { Router } from "express";
import * as c from "../controllers/import_orders.controller";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission('importOrders_view'), c.index);
router.get("/export.xlsx", requirePermission('importOrders_view'), c.exportExcel);
router.get("/export.pdf", requirePermission('importOrders_view'), c.exportPdf);
router.get("/create", requirePermission('importOrders_create'), c.create);
router.post("/create", requirePermission('importOrders_create'), c.createPost);
router.get("/:orderId/pdf", requirePermission('importOrders_view'), c.exportOrderPdf);
router.get("/:orderId/edit", requirePermission('importOrders_edit'), c.edit);
router.post("/:orderId/edit", requirePermission('importOrders_edit'), c.editPost);
router.post("/:orderId/confirm", requirePermission('importOrders_edit'), c.confirm);
router.get("/:orderId", requirePermission('importOrders_view'), c.detail);

export const importOrderRoutes = router;
