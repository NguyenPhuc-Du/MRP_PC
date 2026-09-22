import { prisma } from "../config/database";
import { CreateAccountDto, UpdateAccountDto } from "../dtos/account.dto";
import { Account, Prisma } from "../generated/prisma";
import { hashPassword } from "../utils/password.util";

const uniqueErrorCode = (error: unknown): "USERNAME_TAKEN" | "EMAIL_TAKEN" | null => {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        return null;
    }

    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target.map(String) : [String(target ?? "")];

    if (fields.some((field) => field.includes("username"))) {
        return "USERNAME_TAKEN";
    }
    if (fields.some((field) => field.includes("email"))) {
        return "EMAIL_TAKEN";
    }
    return null;
};

const countAdmins = async (): Promise<number> => {
    return prisma.account.count({
        where: { role: "admin" },
    });
};

export const hasAdminAccount = async (): Promise<boolean> => {
    return (await countAdmins()) > 0;
};

export const createAccount = async (createAccountDto: CreateAccountDto): Promise<void> => {
    const {
        username,
        password,
        fullName,
        email,
        phone,
        role,
        status
    } = createAccountDto;

    if (role === "admin" && await hasAdminAccount()) {
        throw new Error("ADMIN_EXISTS");
    }

    try {
        await prisma.account.create({
            data: {
                username,
                passwordHash: await hashPassword(password),
                fullName,
                email,
                phone,
                role,
                status
            }
        });
    } catch (error) {
        const code = uniqueErrorCode(error);
        if (code) {
            throw new Error(code);
        }
        throw error;
    }
}

export const getAccountById = async (accountId: number): Promise<Account | null> => {
    if (!Number.isInteger(accountId) || accountId <= 0) {
        return null;
    }

    return prisma.account.findUnique({
        where: {
            id: accountId
        }
    });
}

export const updateAccountById = async (updateAccountDto: UpdateAccountDto, accountId: number): Promise<Account> => {
    const existing = await getAccountById(accountId);

    if (!existing) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (existing.role === "admin") {
        if (updateAccountDto.role && updateAccountDto.role !== "admin") {
            throw new Error("CANNOT_DEMOTE_ADMIN");
        }
        if (updateAccountDto.status === "locked") {
            throw new Error("CANNOT_LOCK_ADMIN");
        }
    }

    if (updateAccountDto.role === "admin" && existing.role !== "admin" && await hasAdminAccount()) {
        throw new Error("ADMIN_EXISTS");
    }

    const {
        username,
        password,
        fullName,
        email,
        phone,
        role,
        status
    } = updateAccountDto;

    const data: Prisma.AccountUpdateInput = {
        username,
        fullName,
        email,
        phone,
        role,
        status,
    };

    if (password) {
        data.passwordHash = await hashPassword(password);
    }

    try {
        return await prisma.account.update({
            where: { id: accountId },
            data,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new Error("ACCOUNT_NOT_FOUND");
        }

        const code = uniqueErrorCode(error);
        if (code) {
            throw new Error(code);
        }
        throw error;
    }
}

export const getAllAccounts = async (): Promise<Account[]> => {
    return await prisma.account.findMany();
};

export const lockAccountById = async (accountId: number): Promise<void> => {
    if (!Number.isInteger(accountId) || accountId <= 0) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (account.status === "locked") {
        throw new Error("ACCOUNT_ALREADY_LOCKED");
    }

    if (account.role === "admin") {
        throw new Error("CANNOT_LOCK_ADMIN");
    }

    await prisma.account.update({
        where: { id: accountId },
        data: { status: "locked" },
    });
};

export const unlockAccountById = async (accountId: number): Promise<void> => {
    if (!Number.isInteger(accountId) || accountId <= 0) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (account.status === "active") {
        throw new Error("ACCOUNT_ALREADY_UNLOCKED");
    }

    await prisma.account.update({
        where: { id: accountId },
        data: { status: "active" },
    });
};