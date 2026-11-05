import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import * as componentController from "../controllers/components.controller";
import { requirePermission } from "../middlewares/auth.middleware";
import * as componentValidate from "../validates/components.validate";
import { systemConfig } from "../config/system";

const router = Router();

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP"));
  },
});

const uploadComponentImage = (redirectTo: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single("image")(req, res, (err) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        req.flash("error", "Ảnh tối đa 2MB");
      } else {
        req.flash("error", err.message || "Upload ảnh thất bại");
      }
      res.redirect(redirectTo(req));
    });
  };
};

router.get("/", requirePermission("components_view"), componentController.index);
router.get(
  "/create",
  requirePermission("components_create"),
  componentController.createComponent,
);
router.post(
  "/create",
  requirePermission("components_create"),
  uploadComponentImage(() => `${systemConfig.prefixAdmin}/components/create`),
  componentValidate.validateCreateComponent,
  componentController.createComponentPost,
);
router.delete(
  "/delete/:id",
  requirePermission("components_delete"),
  componentController.deleteComponent,
);
router.get(
  "/edit/:id",
  requirePermission("components_edit"),
  componentController.editComponent,
);
router.patch(
  "/edit/:id",
  requirePermission("components_edit"),
  uploadComponentImage(
    (req) => `${systemConfig.prefixAdmin}/components/edit/${req.params.id}`,
  ),
  componentValidate.validateUpdateComponent,
  componentController.editComponentPatch,
);

export const componentRoutes = router;
