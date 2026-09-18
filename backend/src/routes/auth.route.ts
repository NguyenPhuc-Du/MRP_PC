import { Router } from "express";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.get("/login", authController.login);

export const authRoutes = router;
