import { Router } from "express";
import * as bomController from "../controllers/bom.controller";

const router = Router();

router.get("/", bomController.index);
router.get("/detail/:id", bomController.detail);

export const bomRoutes = router;
