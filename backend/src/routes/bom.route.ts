import { Router } from "express";
import * as bomController from "../controllers/bom.controller";
import * as bomValidate from "../validates/bom.validate";

const router = Router();

router.get("/", bomController.index);

router.get("/create", bomController.create);
router.post("/create", bomValidate.validateCreateBom, bomController.createPost);

router.get("/detail/:id", bomController.detail);
router.post("/detail/:id", bomValidate.validateUpdateBom, bomController.updatePost);

export const bomRoutes = router;
