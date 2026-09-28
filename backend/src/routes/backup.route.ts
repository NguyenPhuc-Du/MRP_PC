import { Router } from "express";
import * as backupController from "../controllers/backup.controller";
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission("backup_view"), backupController.index);

router.post(
  "/",
  requirePermission("backup_create"),
  backupController.createPost,
);

router.get(
  "/download/:filename",
  requirePermission("backup_view"),
  backupController.download,
);

export const backupRoutes = router;
