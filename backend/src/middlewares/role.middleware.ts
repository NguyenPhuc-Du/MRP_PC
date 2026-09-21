import { NextFunction, Request, Response } from "express";

type AccountRole = "admin" | "warehouse_manager" | "staff";

export function requireRole(...allowedRoles: AccountRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.authUser;

    if (!user) {
      res.status(401).json({
        message: "Authentication is required",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        message: "You do not have permission",
      });
      return;
    }

    next();
  };
}
