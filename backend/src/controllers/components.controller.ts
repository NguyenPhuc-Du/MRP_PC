import { Request, Response } from "express";

export const index = async (req: Request, res: Response): Promise<void> => {
    res.render("pages/components/index", {
        pageTitle: "Danh sách linh kiện",
    });
};