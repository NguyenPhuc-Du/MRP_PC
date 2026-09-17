import { Router } from "express";
import * as importOrderController from "../controllers/import_orders.controller";

const router = Router();

router.get("/", importOrderController.index);

router.get("/create", importOrderController.create);
router.post("/create", importOrderController.createPost);

router.get("/:orderId/edit", importOrderController.edit);
router.post("/:orderId/edit", importOrderController.editPost);

router.post("/:orderId/confirm", importOrderController.confirm);

router.get("/:orderId", importOrderController.detail);

export const importOrderRoutes = router;
