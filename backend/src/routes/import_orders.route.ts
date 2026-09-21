import { Router } from "express";
import * as c from "../controllers/import_orders.controller";
import { requireAuth, requireWarehouse } from "../middlewares/auth.middleware";
const router = Router();
router.use(requireAuth); // mọi URL phiếu nhập phải login
router.get("/", c.index); // staff/admin có thể xem nếu bạn cho
// router.get("/export.xlsx", requireWarehouse, c.exportExcel);
// router.get("/export.pdf", requireWarehouse, c.exportPdf);
router.get("/create", requireWarehouse, c.create);
router.post("/create", requireWarehouse, c.createPost);
router.post("/suppliers", requireWarehouse, c.createSupplierPost); // QL kho, TRƯỚC :orderId
router.get("/:orderId/edit", requireWarehouse, c.edit);
router.post("/:orderId/edit", requireWarehouse, c.editPost);
router.post("/:orderId/confirm", requireWarehouse, c.confirm);
router.get("/:orderId", c.detail);
export const importOrderRoutes = router;
