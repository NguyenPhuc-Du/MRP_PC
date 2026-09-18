import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const login = async (req: Request, res: Response): Promise<void> => {
    res.render("pages/auth/login");
}

export const loginPost = async (req: Request, res: Response): Promise<void> => {
    await authService.login(res, req.body.username);
}