import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { systemConfig } from "../config/system";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessToken: string = req.cookies["access_token"];

    if (!accessToken || typeof accessToken !== "string") {
      return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET as string,
    ) as { sub: string | number };

    const accountId = Number(decoded.sub);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      res.clearCookie("access_token");
      return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    const role = await prisma.role.findUnique({
      where: { id: account?.role } // account.role lúc này là 'admin', 'staff', ...
    });

    // Lấy ra mảng permissions để dùng
    const permissions = role?.permissions || [];

    if (!account || account.status === "locked") {
      res.clearCookie("access_token");
      return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    res.locals.user = {
      ...account,
      permissions, // Thêm mảng permissions vào object user
    };
    next();
  } catch (error) {
    res.clearCookie("access_token");
    return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  }
};
// Chỉ quản lý kho được tạo/ sửa/ xác nhận nhập - Dũng
export const requireWarehouse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = req.session.account?.role;
  if (role !== "warehouse_manager") {
    req.flash(
      "error",
      "Chỉ cho phép quản lý kho được nhập hàng và xác nhận phiếu",
    );
    return res.redirect(`${systemConfig.prefixAdmin}/importOrders`);
  }
  next();
};
