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

    const checkPass = comparePassword(password, isExistUsername.passwordHash);

    if(!checkPass) {
        req.flash("error", "Mật khẩu không chính xác");
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        return;
    }

    next();
}