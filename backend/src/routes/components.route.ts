import { Router } from "express";
import * as componentController from "../controllers/components.controller";

const router = Router();

router.get("/", componentController.index);

export const componentRoutes = router;
