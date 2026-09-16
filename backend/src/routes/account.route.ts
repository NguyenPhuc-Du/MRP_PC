import { Router } from "express";
import * as accountController from "../controllers/account.controller";
import * as accountValidate from "../validates/account.validate"

const router = Router();

router.get("/create", accountController.create);

router.post("/create", accountValidate.validateCreateAccount, accountController.createPost);

export const accountRoutes = router;