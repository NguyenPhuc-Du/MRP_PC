import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { systemConfig } from "../config/system";
import * as accountService from "../services/account.service";
import { CreateAccountDto } from "../dtos/account.dto";


export const create = async (req: Request, res: Response): Promise<void> => {
    const oldInput = req.session.oldInput ?? {};
    delete req.session.oldInput;

    res.render("pages/accounts/create", {
        pageTitle: "Tạo mới tài khoản",
        oldInput,
    });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
    const data = matchedData(req);

    const createAccountDto: CreateAccountDto = {
        username: data.username,
        password: data.password,
        role: data.role,
        fullName: data.fullName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        status: data.status || undefined,
    };

    try {
        await accountService.createAccount(createAccountDto);

        req.flash("success", "Tạo mới tài khoản thành công");
        res.redirect(`${systemConfig.prefixAdmin}/accounts/create`);
    } catch (error) {
        console.error(error);

        const { password, confirmPassword, ...oldInput } = req.body;

        req.session.oldInput = oldInput;
        req.flash("error", "Tạo mới tài khoản thất bại!");
        res.redirect(`${systemConfig.prefixAdmin}/accounts/create`);
    }
}
