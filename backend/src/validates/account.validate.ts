import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AccountRole, AccountStatus } from "../generated/prisma/index.js";
import { systemConfig } from "../config/system.js";

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const { password, confirmPassword, ...oldInput } = req.body;

        req.session.oldInput = oldInput;
        req.flash("error", errors.array().map((error) => error.msg).join(". "));
        res.redirect(`${systemConfig.prefixAdmin}/accounts/create`);
        return;
    }

    next();
};

export const validateCreateAccount = [
    body("username")
        .trim()
        .notEmpty()
        .withMessage("Tên đăng nhập không được để trống")
        .isLength({ max: 50 })
        .withMessage("Tên đăng nhập tối đa 50 ký tự"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),

    body("confirmPassword")
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Mật khẩu xác nhận không khớp"),

    body("role")
        .isIn(Object.values(AccountRole))
        .withMessage("Vai trò không hợp lệ"),

    body("status")
        .optional({ values: "falsy" })
        .isIn(Object.values(AccountStatus))
        .withMessage("Trạng thái không hợp lệ"),

    body("fullName")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 100 })
        .withMessage("Họ và tên tối đa 100 ký tự"),

    body("email")
        .optional({ values: "falsy" })
        .trim()
        .isEmail()
        .withMessage("Email không đúng định dạng")
        .isLength({ max: 100 })
        .withMessage("Email tối đa 100 ký tự"),

    body("phone")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 20 })
        .withMessage("Số điện thoại tối đa 20 ký tự"),

    handleValidationErrors,
];
