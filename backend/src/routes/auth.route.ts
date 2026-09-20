import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as authValidate from "../validates/auth.validate";

const router = Router();

router.get("/login", authController.login);

router.post("/login", authValidate.loginValidate, authController.loginPost);

router.post("/logout", authController.logout);

export const authRoutes = router;
