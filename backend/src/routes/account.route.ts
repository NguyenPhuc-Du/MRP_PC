import { Router } from "express";
import * as accountController from "../controllers/account.controller";
import * as accountValidate from "../validates/account.validate"

const router = Router();

router.get("/create", accountController.create);

router.post("/create", accountValidate.validateCreateAccount, accountController.createPost);

router.get("/edit/:accountId", accountController.edit);

router.patch("/edit/:accountId", accountValidate.validateUpdateAccount, accountController.editPatch);

export const accountRoutes = router;