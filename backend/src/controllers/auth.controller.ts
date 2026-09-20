import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { systemConfig } from "../config/system";

export const login = async (req: Request, res: Response): Promise<void> => {
  res.render("pages/auth/login");
};

export const loginPost = async (req: Request, res: Response): Promise<void> => {
  await authService.login(res, req.body.username);
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  await authService.logout(res);

  res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
}