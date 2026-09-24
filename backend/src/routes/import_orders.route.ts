import { Router } from "express";
import * as c from "../controllers/import_orders.controller";
import { requireAuth, requirePermission, requireWarehouse } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission('importOrders_view'), c.index);
router.get("/export.xlsx", requirePermission('importOrders_view'), requireWarehouse, c.exportExcel);
router.get("/export.pdf", requirePermission('importOrders_view'), requireWarehouse, c.exportPdf);
router.get("/create", requirePermission('importOrders_create'), requireWarehouse, c.create);
router.post("/create", requirePermission('importOrders_create'), requireWarehouse, c.createPost);
router.post("/suppliers", requirePermission('importOrders_create'), requireWarehouse, c.createSupplierPost);
router.post("/brands", requirePermission('importOrders_create'), requireWarehouse, c.createBrandPost);
router.get("/:orderId/pdf", requirePermission('importOrders_view'), c.exportOrderPdf);
router.get("/:orderId/edit", requirePermission('importOrders_edit'), requireWarehouse, c.edit);
router.post("/:orderId/edit", requirePermission('importOrders_edit'), requireWarehouse, c.editPost);
router.post("/:orderId/confirm", requirePermission('importOrders_edit'), requireWarehouse, c.confirm);
router.get("/:orderId", requirePermission('importOrders_view'), c.detail);

export const importOrderRoutes = router;
