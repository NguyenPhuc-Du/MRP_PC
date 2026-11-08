import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import * as backupController from "../controllers/backup.controller";
import { requirePermission } from "../middlewares/auth.middleware";
import { systemConfig } from "../config/system";

const router = Router();
const backupPath = () => `${systemConfig.prefixAdmin}/backup`;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    if (name.endsWith(".sql")) {
      cb(null, true);
      return;
    }
    cb(new Error("Chỉ chấp nhận file .sql"));
  },
});

const uploadBackupFile = (req: Request, res: Response, next: NextFunction): void => {
  upload.single("backupFile")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      req.flash("error", "File sao lưu tối đa 100MB");
    } else {
      req.flash("error", err.message || "Nạp file thất bại");
    }
    res.redirect(backupPath());
  });
};

router.get("/", requirePermission("backup_view"), backupController.index);

router.post(
  "/",
  requirePermission("backup_create"),
  backupController.createPost,
);

router.post(
  "/upload",
  requirePermission("backup_create"),
  uploadBackupFile,
  backupController.uploadPost,
);

router.post(
  "/restore/:filename",
  requirePermission("backup_create"),
  backupController.restorePost,
);

router.get(
  "/download/:filename",
  requirePermission("backup_view"),
  backupController.download,
);

export const backupRoutes = router;
