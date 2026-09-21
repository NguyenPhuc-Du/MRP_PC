import { Router } from "express";
import * as c from "../controllers/import_orders.controller";
import { requireAuth, requireWarehouse } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", c.index);
router.get("/export.xlsx", requireWarehouse, c.exportExcel);
router.get("/export.pdf", requireWarehouse, c.exportPdf);
router.get("/create", requireWarehouse, c.create);
router.post("/create", requireWarehouse, c.createPost);
router.post("/suppliers", requireWarehouse, c.createSupplierPost);
router.post("/brands", requireWarehouse, c.createBrandPost);
router.get("/:orderId/pdf", c.exportOrderPdf);
router.get("/:orderId/edit", requireWarehouse, c.edit);
router.post("/:orderId/edit", requireWarehouse, c.editPost);
router.post("/:orderId/confirm", requireWarehouse, c.confirm);
router.get("/:orderId", c.detail);

export const importOrderRoutes = router;
