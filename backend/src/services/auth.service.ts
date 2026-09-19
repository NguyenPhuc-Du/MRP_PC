import { Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/db";
import { systemConfig } from "../config/system";
import { comparePassword } from "../utils/password.util";
import { AccountRole } from "../generated/prisma";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function createAccessToken(account: {
  id: number;
  username: string;
  role: AccountRole;
}): string {
  return jwt.sign(
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
}

/** Login cho Android API — trả JWT + user (JSON). */
export async function loginForApi(username: string, password: string) {
  const account = await prisma.account.findUnique({
    where: { username },
  });

  if (!account || account.status !== "active") {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordCorrect = await comparePassword(password, account.passwordHash);
  if (!passwordCorrect) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = createAccessToken(account);

  return {
    accessToken,
    user: {
      id: account.id,
      username: account.username,
      fullName: account.fullName,
      role: account.role,
    },
  };
}

/** Login cho Web — password đã check ở validate; set cookie rồi redirect. */
export async function login(res: Response, username: string): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { username },
  });

  if (!account || account.status !== "active") {
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }

  const accessToken = createAccessToken(account);

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
  });

  if (account.role === "warehouse_manager") {
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
    return;
  }

  res.redirect(`${systemConfig.prefixAdmin}/components`);
}
