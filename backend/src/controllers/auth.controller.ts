import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { systemConfig } from "../config/system";
import { UpdateProfileDto, ChangePasswordDto } from "../dtos/profile.dto";


export const login = async (req: Request, res: Response): Promise<void> => {
  res.render("pages/auth/login");
};

export const loginPost = async (req: Request, res: Response): Promise<void> => {
  await authService.login(res, req.body.username);
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  await authService.logout(res);

  res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
};

export const profile = async (req: Request, res: Response): Promise<void> => {
  const id: number = Number(res.locals.user.id);
  const user = await authService.getProfileById(id);

  if (!user) {
    req.flash("error", "Không tìm thấy tài khoản");
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }

  res.render("pages/auth/profile.pug", {
    pageTitle: "Thông tin cá nhân",
    user,
  });
};

export const profilePost = async (req: Request, res: Response): Promise<void> => {
  const id: number = Number(res.locals.user.id);

  const updateProfileDto: UpdateProfileDto = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
  };

  try {
    await authService.updateProfileById(updateProfileDto, id);
    req.flash("success", "Cập nhật thông tin cá nhân thành công");
  } catch (error) {
    req.flash("error", "Cập nhật thông tin cá nhân thất bại");
  }

  res.redirect(`${systemConfig.prefixAdmin}/auth/profile`);
};

export const profileChangePasswordPost = async (req: Request, res: Response): Promise<void> => {
  const id: number = Number(res.locals.user.id);

  const changePasswordDto: ChangePasswordDto = {
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    confirmPassword: req.body.confirmPassword,
  };

  try {
    await authService.changePasswordById(changePasswordDto, id);
    req.flash("success", "Đổi mật khẩu thành công");
  } catch (error) {
    req.flash("error", "Đổi mật khẩu thất bại");
  }

  res.redirect(`${systemConfig.prefixAdmin}/auth/profile`);
};
