import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/db";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}

export async function login (username: string, password: string) {
    const account = await prisma.account.findUnique({
        where: { username },
    });

    if (!account || account.status !== "active") {
        throw new Error("INVALID_CREDENTIALS");
    }

    const passwordCorrect = await bcrypt.compare(
        password,
        account.passwordHash,
    );

    if (!passwordCorrect) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const accessToken = jwt.sign(
        {
            sub: account.id,
            username: account.username,
            role: account.role,
        },
        getJwtSecret(),
        {
            expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"],
        },
    );

    return {
        accessToken,
        user: {
            id: account.id,
            username: account.username,
            fullname: account.fullName,
            role: account.role,
        },
    };
}