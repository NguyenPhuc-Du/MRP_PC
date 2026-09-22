import { Router } from "express";
import multer from "multer";
import * as componentController from "../controllers/components.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
router.get("/", componentController.index);
router.delete("/delete/:id", componentController.deleteComponent);
router.get("/edit/:id", componentController.editComponent);
router.patch("/edit/:id", upload.single("image"), componentController.editComponentPatch);
export const componentRoutes = router;
