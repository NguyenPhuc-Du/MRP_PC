import { Router } from "express";
import * as exportOrderController from "../controllers/export_orders.controller";

const router = Router();

router.get("/", exportOrderController.index);

export const exportOrderRoutes = router;
