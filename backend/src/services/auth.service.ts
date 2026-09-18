import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/db";
import { systemConfig } from "../config/system";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}

export async function login (res: Response, username: string) {
    const account = await prisma.account.findUnique({
        where: {
            username: username
        }
    });

    const accessToken = jwt.sign(
        {
            sub: account?.id,
            username: account?.username,
            role: account?.role,
        },
        getJwtSecret(),
        {
            expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"],
        },
    );

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
    });


    res.redirect(`${systemConfig.prefixAdmin}/components`);
}