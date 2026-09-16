import { Request, Response } from "express";

export const create = async (req: Request, res: Response): Promise<void> => {
    res.render("pages/accounts/create", {
        pageTitle: "Tạo mới tài khoản",
    });
};