import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as authValidate from "../validates/auth.validate";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/login", authController.login);

router.post("/login", authValidate.loginValidate, authController.loginPost);

router.post("/logout", authController.logout);

router.get("/profile", requireAuth, authController.profile);

router.post("/profile", requireAuth, authController.profilePost);

router.post("/profile/change-password", requireAuth, authValidate.changePasswordValidate, authController.profileChangePasswordPost);

export const authRoutes = router;
