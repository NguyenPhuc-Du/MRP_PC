import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/database";
import { prefixForRole, systemConfig } from "../config/system";
import { firstViewPath, sanitizePermissions } from "../constants/permissions";

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

    const permissions = sanitizePermissions(role?.permissions);

    res.locals.user = {
      ...account,
      permissions,
    };
    res.locals.navPermissions = permissions;

    req.session.account = {
      id: account.id,
      username: account.username,
      fullName: account.fullName,
      role: account.role,
    };

    const wanted = prefixForRole(account.role);
    res.locals.prefixAdmin = wanted;
    res.locals.prefixWarehouse = systemConfig.prefixWarehouse;

    const pathOnly = req.originalUrl.split("?")[0];
    const onWarehouse =
      pathOnly === systemConfig.prefixWarehouse ||
      pathOnly.startsWith(`${systemConfig.prefixWarehouse}/`);
    const current = onWarehouse
      ? systemConfig.prefixWarehouse
      : systemConfig.prefixAdmin;

    if (current !== wanted) {
      const rest = pathOnly.startsWith(current) ? pathOnly.slice(current.length) : "";
      const query = req.originalUrl.includes("?")
        ? `?${req.originalUrl.split("?")[1]}`
        : "";
      res.redirect(`${wanted}${rest || ""}${query}`);
      return;
    }

    next();
  } catch {
    res.clearCookie("access_token");
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  }
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


export const requirePermission = (permissionKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions: string[] = res.locals.user?.permissions || [];

    if (permissions.includes(permissionKey)) {
      return next();
    }

    req.flash("error", "Bạn không có quyền truy cập chức năng này");
    const home = firstViewPath(
      permissions,
      prefixForRole(req.session.account?.role),
    );
    const referrer = req.get("Referrer");
    const backUrl =
      referrer && !referrer.includes("/auth/login")
        ? referrer
        : home ?? `${systemConfig.prefixAdmin}/auth/login`;
    return res.redirect(backUrl);
  }
}