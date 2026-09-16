import { Router } from "express";
import * as authController from "./auth.api.controller";

const router = Router();
router.post("/auth/login", authController.login);

export default router;