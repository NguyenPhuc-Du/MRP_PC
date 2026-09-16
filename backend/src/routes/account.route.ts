import { Router } from "express";
import * as accountController from "../controllers/account.controller";

const router = Router();

router.get("/create", accountController.create);

export const accountRoutes = router;