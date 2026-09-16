import { Request, Response } from "express";

export const create = async (req: Request, res: Response): Promise<void> => {
    req.flash("success", "đã có");
    res.render("pages/accounts/create", {
        pageTitle: "Tạo mới tài khoản",
    });
};