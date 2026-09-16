import type { AccountRole, AccountStatus } from "../generated/prisma/index.js";

export interface CreateAccountDto {
    username: string;
    password: string;
    role: AccountRole;
    fullName?: string;
    email?: string;
    phone?: string;
    status?: AccountStatus;
}

export interface UpdateAccountDto {
    username?: string;
    password?: string;
    role?: AccountRole;
    fullName?: string;
    email?: string;
    phone?: string;
    status?: AccountStatus;
}
