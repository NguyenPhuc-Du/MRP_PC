import { Router } from "express";
import * as permissionController from "../controllers/permission.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission("roles_view"), permissionController.index);

router.patch("/", requirePermission("roles_permissions"), permissionController.permissionsPatch);

export const permissionRoutes = router;
