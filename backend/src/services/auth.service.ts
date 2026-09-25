// import { Response } from "express";
import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/db";
import { systemConfig } from "../config/system";
import { comparePassword, hashPassword } from "../utils/password.util";
import { Account, AccountRole, Prisma } from "../generated/prisma";
import { ChangePasswordDto, UpdateProfileDto } from "../dtos/profile.dto";
import { firstViewPath } from "../constants/permissions";

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
      expiresIn: (process.env.JWT_EXPIRES_IN ??
        "1h") as SignOptions["expiresIn"],
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
export async function login(
  req: Request,
  res: Response,
  username: string,
): Promise<void> {
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

  req.session.account = {
    id: account.id,
    username: account.username,
    fullName: account.fullName,
    role: account.role,
  };

  const role = await prisma.role.findUnique({
    where: { id: account.role },
    select: { permissions: true },
  });

  const home = firstViewPath(role?.permissions, systemConfig.prefixAdmin);

  if (!home) {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    req.flash("error", "Tài khoản chưa được cấp quyền xem bất kỳ trang nào");
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }

  res.redirect(home);
}


export const logout = async (res: Response): Promise<void> => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

const emptyToUndefined = (value?: string): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const uniqueEmailError = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : [String(target ?? "")];
  return fields.some((field) => field.includes("email"));
};

export const getProfileById = async (accountId: number): Promise<Account | null> => {
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return null;
  }

  return prisma.account.findUnique({
    where: { id: accountId },
  });
};

export const updateProfileById = async (updateProfileDto: UpdateProfileDto, accountId: number): Promise<Account> => {
  const existing = await getProfileById(accountId);

  if (!existing) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  try {
    return await prisma.account.update({
      where: { id: accountId },
      data: {
        fullName: emptyToUndefined(updateProfileDto.fullName),
        email: emptyToUndefined(updateProfileDto.email),
        phone: emptyToUndefined(updateProfileDto.phone),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    if (uniqueEmailError(error)) {
      throw new Error("EMAIL_TAKEN");
    }
    throw error;
  }
};

export const changePasswordById = async (changePasswordDto: ChangePasswordDto, accountId: number): Promise<void> => {
  const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

  if (newPassword !== confirmPassword) {
    throw new Error("PASSWORD_MISMATCH");
  }

  const account = await getProfileById(accountId);

  if (!account) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const currentOk = await comparePassword(currentPassword, account.passwordHash);
  if (!currentOk) {
    throw new Error("WRONG_CURRENT_PASSWORD");
  }

  await prisma.account.update({
    where: { id: accountId },
    data: {
      passwordHash: await hashPassword(newPassword),
    },
  });
};