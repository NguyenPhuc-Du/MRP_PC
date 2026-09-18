import { Router } from "express";
import * as permissionController from "../controllers/permission.controller";

const router = Router();

router.get("/", permissionController.index);

router.patch("/", permissionController.permissionsPatch);

export const permissionRoutes = router;
