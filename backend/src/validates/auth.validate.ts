import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { systemConfig } from "../config/system";
import { comparePassword } from "../utils/password.util";


export const loginValidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { username, password } = req.body;

    const isExistUsername = await prisma.account.findUnique({
        where: {
            username: username
        }
    });

    if(!isExistUsername) {
        req.flash("error", "Người dùng không tồn tại");
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        return;
    }

    const checkPass = await comparePassword(password, isExistUsername.passwordHash);

    if(!checkPass) {
        req.flash("error", "Mật khẩu không chính xác");
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        return;
    }

    next();
}

export const changePasswordValidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        req.flash("error", "Vui lòng nhập đầy đủ thông tin mật khẩu");
        res.redirect(`${systemConfig.prefixAdmin}/auth/profile`);
        return;
    }

    if (newPassword.length < 8) {
        req.flash("error", "Mật khẩu mới phải có ít nhất 8 ký tự");
        res.redirect(`${systemConfig.prefixAdmin}/auth/profile`);
        return;
    }

    if (newPassword !== confirmPassword) {
        req.flash("error", "Mật khẩu xác nhận không khớp");
        res.redirect(`${systemConfig.prefixAdmin}/auth/profile`);
        return;
    }

    next();
};