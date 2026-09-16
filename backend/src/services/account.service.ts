import { prisma } from "../config/database";
import bcrypt from "bcrypt";
import { CreateAccountDto } from "../dtos/account.dto";
import { Account } from "../generated/prisma";


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

    const hashedPassword: string = await bcrypt.hash(password, 10);

    await prisma.account.create({
        data: {
            username,
            passwordHash: hashedPassword,
            fullName,
            email,
            phone,
            role,
            status
        }
    });
}

export const getAccountById = async (accountId: number): Promise<Account | null> => {
    const account = await prisma.account.findUnique({
        where: { 
            id: accountId 
        }
    });

    return account;
}