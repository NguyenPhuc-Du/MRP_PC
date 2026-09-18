export {};

declare global {
    namespace Express {
        interface Request {
            authUser?: {
                accountId: number;
                username: string;
                role: "admin" | "warehouse_manager" | "staff";
            };
        }
    }
}