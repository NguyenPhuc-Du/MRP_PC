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
    if (!Number.isInteger(accountId) || accountId <= 0) {
        throw new Error("ACCOUNT_NOT_FOUND");
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