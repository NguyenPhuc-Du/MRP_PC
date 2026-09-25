import { Router } from "express";
import * as productionController from "../controllers/production.controller";
import { requirePermission } from "../middlewares/auth.middleware";
import * as productionValidate from "../validates/production.validate";

const router = Router();

router.get("/", requirePermission("production_view"), productionController.index);

router.get("/create", requirePermission("production_create"), productionController.create);
router.post(
  "/create",
  requirePermission("production_create"),
  productionValidate.validateCreateProduction,
  productionController.createPost,
);

router.get("/:orderId", requirePermission("production_view"), productionController.detail);

export const productionRoutes = router;
