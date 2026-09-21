import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/database";
import { systemConfig } from "../config/system";

interface AccessTokenPayload extends JwtPayload {
  username?: string;
  role?: "admin" | "warehouse_manager" | "staff";
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

/** Web: cookie JWT → redirect login nếu fail. */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessToken = req.cookies?.["access_token"];

    if (!accessToken || typeof accessToken !== "string") {
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }

    const decoded = jwt.verify(accessToken, getJwtSecret()) as AccessTokenPayload;
    const accountId = Number(decoded.sub);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      res.clearCookie("access_token");
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (!account || account.status === "locked") {
      res.clearCookie("access_token");
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }

    const role = await prisma.role.findUnique({
      where: { id: account.role },
    });

    const permissions = role?.permissions || [];

    res.locals.user = {
      ...account,
      permissions,
    };

    req.session.account = {
      id: account.id,
      username: account.username,
      fullName: account.fullName,
      role: account.role,
    };

    next();
  } catch {
    res.clearCookie("access_token");
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  }
};

/** Web: chỉ quản lý kho. */
export const requireWarehouse = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const role =
    (res.locals.user as { role?: string } | undefined)?.role ??
    req.session.account?.role;

  if (role !== "warehouse_manager") {
    req.flash(
      "error",
      "Chỉ cho phép quản lý kho được nhập hàng và xác nhận phiếu",
    );
    res.redirect(`${systemConfig.prefixAdmin}/importOrders`);
    return;
  }

  next();
};

/** API Android: Bearer JWT. */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Access token is required",
      });
      return;
    }

    const token = authorization.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as AccessTokenPayload;
    const accountId = Number(decoded.sub);

    if (!Number.isInteger(accountId) || !decoded.username || !decoded.role) {
      res.status(401).json({
        message: "Invalid access token",
      });
      return;
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
      },
    });

    if (!account || account.status !== "active") {
      res.status(401).json({
        message: "Account is locked or does not exist",
      });
      return;
    }

    req.authUser = {
      accountId: account.id,
      username: account.username,
      role: account.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: "Access token has expired",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Invalid access token",
      });
      return;
    }

    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
