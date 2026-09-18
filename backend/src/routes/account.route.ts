import { Router } from "express";
import * as accountController from "../controllers/account.controller";
import * as accountValidate from "../validates/account.validate"
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requireAuth, accountController.index);

router.get("/create", requireAuth, accountController.create);

router.post("/create", requireAuth, accountValidate.validateCreateAccount, accountController.createPost);

router.get("/edit/:accountId", requireAuth, accountController.edit);

router.patch("/edit/:accountId", requireAuth, accountValidate.validateUpdateAccount, accountController.editPatch);

router.patch("/lock/:accountId", requireAuth, accountController.lock);

export const accountRoutes = router;