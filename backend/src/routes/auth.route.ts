import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as authValidate from "../validates/auth.validate";
import { requireAuth } from "../middlewares/auth.middleware";

const loginRouter = Router();

loginRouter.get("/login", authController.login);

loginRouter.post("/login", authValidate.loginValidate, authController.loginPost);

const router = Router();

router.post("/logout", authController.logout);

router.get("/profile", requireAuth, authController.profile);

router.post("/profile", requireAuth, authController.profilePost);

router.post("/profile/change-password", requireAuth, authValidate.changePasswordValidate, authController.profileChangePasswordPost);

export const loginRoutes = loginRouter;
export const authRoutes = router;
