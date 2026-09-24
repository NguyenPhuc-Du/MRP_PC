import { Router } from "express";
import * as bomController from "../controllers/bom.controller";
import * as bomValidate from "../validates/bom.validate";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission('bom_view'), bomController.index);

router.get("/create", requirePermission('bom_create'), bomController.create);
router.post("/create", requirePermission('bom_create'), bomValidate.validateCreateBom, bomController.createPost);

router.get("/detail/:id", requirePermission('bom_view'), bomController.detail);
router.post("/detail/:id", requirePermission('bom_view'), bomValidate.validateUpdateBom, bomController.updatePost);

export const bomRoutes = router;
