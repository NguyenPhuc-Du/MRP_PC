import { Request, Response } from "express";

export const login = async (req: Request, res: Response): Promise<void> => {
    res.render("pages/auth/login");
}