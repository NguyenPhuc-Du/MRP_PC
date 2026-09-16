import { prisma } from "../config/database";
import bcrypt from "bcrypt";
import { CreateAccountDto } from "../dtos/account.dto";


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