import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { systemConfig } from "../config/system";
import * as accountService from "../services/account.service";
import { CreateAccountDto, UpdateAccountDto } from "../dtos/account.dto";

const uniqueErrorMessage = (error: unknown): string | null => {
  if (!(error instanceof Error)) {
    return null;
  }
  if (error.message === "USERNAME_TAKEN") {
    return "Tên đăng nhập đã tồn tại";
  }
  if (error.message === "EMAIL_TAKEN") {
    return "Email đã được sử dụng";
  }
  if (error.message === "ACCOUNT_NOT_FOUND") {
    return "ID không hợp lệ";
  }
  if (error.message === "ACCOUNT_ALREADY_LOCKED") {
    return "Tài khoản này đã bị khóa";
  }
  if (error.message === "CANNOT_LOCK_ADMIN") {
    return "Không thể khóa tài khoản admin";
  }
  if (error.message === "ADMIN_EXISTS") {
    return "Hệ thống chỉ được có một quản trị viên";
  }
  if (error.message === "CANNOT_DEMOTE_ADMIN") {
    return "Không thể đổi vai trò của quản trị viên";
  }
  return null;
};

const storeOldInput = (req: Request): void => {
  const { password, confirmPassword, ...oldInput } = req.body;
  req.session.oldInput = oldInput;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const accounts = await accountService.getAllAccounts();

  res.render("pages/accounts/index", {
    pageTitle: "Danh sách tài khoản",
    accounts,
    totalAccounts: accounts.length,
  });
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const oldInput = req.session.oldInput ?? {};
  delete req.session.oldInput;

  res.render("pages/accounts/create", {
    pageTitle: "Tạo mới tài khoản",
    oldInput,
    adminExists: await accountService.hasAdminAccount(),
  });
};

export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
    storeOldInput(req);
    req.flash(
      "error",
      uniqueErrorMessage(error) ?? "Tạo mới tài khoản thất bại!",
    );
    res.redirect(`${systemConfig.prefixAdmin}/accounts/create`);
  }
};

export const edit = async (req: Request, res: Response): Promise<void> => {
  const accountId: number = Number(req.params.accountId);
  const oldInput = req.session.oldInput ?? {};
  delete req.session.oldInput;

  try {
    const account = await accountService.getAccountById(accountId);

    if (!account) {
      req.flash("error", "ID không hợp lệ");
      res.redirect(`${systemConfig.prefixAdmin}/accounts`);
      return;
    }

    res.render("pages/accounts/edit", {
      pageTitle: "Chỉnh sửa tài khoản",
      account,
      oldInput,
      adminExists: await accountService.hasAdminAccount(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Không tải được tài khoản");
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};

export const editPatch = async (req: Request, res: Response): Promise<void> => {
  const accountId: number = Number(req.params.accountId);

  const data = matchedData(req);

  const updateAccountDto: UpdateAccountDto = {
    username: data.username,
    password: data.password || undefined,
    role: data.role,
    fullName: data.fullName || undefined,
    email: data.email || undefined,
    phone: data.phone || undefined,
    status: data.status || undefined,
  };

  try {
    await accountService.updateAccountById(updateAccountDto, accountId);

    req.flash("success", "Cập nhật tài khoản thành công");
    res.redirect(`${systemConfig.prefixAdmin}/accounts/edit/${accountId}`);
  } catch (error) {
    console.error(error);
    storeOldInput(req);
    req.flash(
      "error",
      uniqueErrorMessage(error) ?? "Cập nhật tài khoản thất bại!",
    );
    res.redirect(`${systemConfig.prefixAdmin}/accounts/edit/${accountId}`);
  }
};

export const lock = async (req: Request, res: Response): Promise<void> => {
  const accountId: number = Number(req.params.accountId);

  try {
    await accountService.lockAccountById(accountId);

    req.flash("success", "Đã khóa tài khoản");
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  } catch (error) {
    console.error(error);
    req.flash("error", uniqueErrorMessage(error) ?? "Khóa tài khoản thất bại!");
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};
