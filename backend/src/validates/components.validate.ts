import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { ComponentStatus } from "../generated/prisma/index.js";
import { systemConfig } from "../config/system.js";
import { COMPONENT_UNITS } from "../constants/component-units.js";

const handleValidationErrors = (redirectTo: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    req.flash("error", errors.array().map((error) => error.msg).join(". "));
    res.redirect(redirectTo(req));
  };
};

const componentFieldRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên linh kiện không được để trống")
    .isLength({ max: 150 })
    .withMessage("Tên linh kiện tối đa 150 ký tự"),

  body("unitPrice")
    .notEmpty()
    .withMessage("Giá nhập không được để trống")
    .isFloat({ min: 0 })
    .withMessage("Giá nhập không hợp lệ"),

  body("categoryId")
    .notEmpty()
    .withMessage("Loại linh kiện không được để trống")
    .isInt({ min: 1 })
    .withMessage("Loại linh kiện không hợp lệ")
    .toInt(),

  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Đơn vị tính không được để trống")
    .isIn([...COMPONENT_UNITS])
    .withMessage("Đơn vị tính không hợp lệ"),

  body("minStockThreshold")
    .optional({ values: "falsy" })
    .isInt({ min: 0 })
    .withMessage("Tồn tối thiểu không hợp lệ")
    .toInt(),

  body("status")
    .optional({ values: "falsy" })
    .isIn(Object.values(ComponentStatus))
    .withMessage("Trạng thái không hợp lệ"),

  body("brandId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Thương hiệu không hợp lệ")
    .toInt(),

  body("supplierId")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Nhà cung cấp không hợp lệ")
    .toInt(),
];

export const validateCreateComponent = [
  ...componentFieldRules,
  body("idempotencyKey")
    .trim()
    .notEmpty()
    .withMessage("Yêu cầu không hợp lệ")
    .isLength({ max: 64 })
    .withMessage("Yêu cầu không hợp lệ"),
  handleValidationErrors(() => `${systemConfig.prefixAdmin}/components/create`),
];

export const validateUpdateComponent = [
  ...componentFieldRules,
  handleValidationErrors(
    (req) => `${systemConfig.prefixAdmin}/components/edit/${req.params.id}`,
  ),
];
