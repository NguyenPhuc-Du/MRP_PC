import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { systemConfig } from "../config/system";


export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const accessToken: string = req.cookies["access_token"];

        if (!accessToken || typeof accessToken !== "string") {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET as string) as { sub: string | number };

        const accountId = Number(decoded.sub);

        if (!Number.isInteger(accountId) || accountId <= 0) {
            res.clearCookie("access_token");
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        const account = await prisma.account.findUnique({
            where: {
                id: accountId
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                status: true
            }
        });

        if (!account || account.status === "locked") {
            res.clearCookie("access_token");
            return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }

        res.locals.user = account;
        next();
    } catch (error) {
        res.clearCookie("access_token");
        return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
}