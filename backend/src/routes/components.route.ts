import { Router } from "express";
import multer from "multer";
import * as componentController from "../controllers/components.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.get("/", requirePermission('components_view'), componentController.index);
router.get("/create", requirePermission('components_create'), componentController.createComponent);
router.post("/create", requirePermission('components_create'), upload.single("image"), componentController.createComponentPost);
router.delete("/delete/:id", requirePermission('components_delete'), componentController.deleteComponent);
router.get("/edit/:id", requirePermission('components_edit'), componentController.editComponent);
router.patch("/edit/:id", requirePermission('components_edit'), upload.single("image"), componentController.editComponentPatch);
export const componentRoutes = router;
