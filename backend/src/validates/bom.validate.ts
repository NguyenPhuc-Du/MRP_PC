import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { systemConfig } from "../config/system.js";
import { bomFormDraftFromBody } from "../services/bom.service.js";

const rememberDraft = (req: Request): void => {
  const configId = Number(req.params.id);
  req.session.bomDraft = bomFormDraftFromBody(
    req.body as Record<string, unknown>,
    Number.isInteger(configId) && configId > 0 ? configId : undefined,
  );
};

const handleValidationErrors = (redirectTo: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    rememberDraft(req);
    req.flash("error", errors.array().map((error) => error.msg).join(". "));
    req.session.save(() => {
      res.redirect(redirectTo(req));
    });
  };
};

const bomFieldRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên cấu hình không được để trống")
    .isLength({ max: 100 })
    .withMessage("Tên cấu hình tối đa 100 ký tự"),
  body("salePrice")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Giá bán không hợp lệ"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(["active", "inactive"])
    .withMessage("Trạng thái không hợp lệ"),
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Mô tả tối đa 2000 ký tự"),
];

export const validateCreateBom = [
  ...bomFieldRules,
  handleValidationErrors(() => `${systemConfig.prefixAdmin}/bom/create`),
];

export const validateUpdateBom = [
  ...bomFieldRules,
  handleValidationErrors((req) => `${systemConfig.prefixAdmin}/bom/detail/${req.params.id}`),
];
