import { Router } from "express";
import * as accountController from "../controllers/account.controller";
import * as accountValidate from "../validates/account.validate"
import { requirePermission } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requirePermission("account_view"), accountController.index);

router.get("/create", requirePermission("account_create"), accountController.create);

router.post("/create", requirePermission("account_create"), accountValidate.validateCreateAccount, accountController.createPost);

router.get("/edit/:accountId", requirePermission("account_edit"), accountController.edit);

router.patch("/edit/:accountId", requirePermission("account_edit"), accountValidate.validateUpdateAccount, accountController.editPatch);

router.patch("/lock/:accountId", requirePermission("account_lock"), accountController.lock);

router.patch("/unlock/:accountId", requirePermission("account_lock"), accountController.unlock);

router.get("/:accountId", requirePermission("account_view"), accountController.detail);

export const accountRoutes = router;