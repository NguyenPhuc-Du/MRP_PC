import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { systemConfig } from "../config/system.js";

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

export const validateCreateProduction = [
  body("pcConfigId")
    .notEmpty()
    .withMessage("Chọn cấu hình PC")
    .isInt({ min: 1 })
    .withMessage("Cấu hình PC không hợp lệ"),
  body("assignedTo")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Nhân viên được giao không hợp lệ"),
  handleValidationErrors(() => `${systemConfig.prefixAdmin}/production/create`),
];
