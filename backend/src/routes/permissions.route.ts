import { Router } from "express";
import * as permissionController from "../controllers/permission.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requireAuth, permissionController.index);

router.patch("/", requireAuth, permissionController.permissionsPatch);

export const permissionRoutes = router;
