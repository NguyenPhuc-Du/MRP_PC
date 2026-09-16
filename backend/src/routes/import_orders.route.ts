import { Router } from "express";
import * as importOrderController from "../controllers/import_orders.controller";

const router = Router();

router.get("/", importOrderController.index);

export const importOrderRoutes = router;
