import { Router } from "express";
import * as accountController from "../controllers/account.controller";
import * as accountValidate from "../validates/account.validate"

const router = Router();

router.get("/", accountController.index);

router.get("/create", accountController.create);

router.post("/create", accountValidate.validateCreateAccount, accountController.createPost);

router.get("/edit/:accountId", accountController.edit);

router.patch("/edit/:accountId", accountValidate.validateUpdateAccount, accountController.editPatch);

router.patch("/lock/:accountId", accountController.lock);

export const accountRoutes = router;