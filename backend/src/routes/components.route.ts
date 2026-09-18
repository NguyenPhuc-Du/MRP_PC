import { Router } from "express";
import * as componentController from "../controllers/components.controller";

const router = Router();

router.get("/", componentController.index);
router.delete("/delete/:id", componentController.deleteComponent);
export const componentRoutes = router;
