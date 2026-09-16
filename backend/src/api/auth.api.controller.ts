import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            res.status(400).json({
                message: "Invalid request body",
            });
            return;
        }

        const result = await authService.login(username.trim(), password);

        if (result.user.role !== "staff") {
            res.status(403).json({
                message: "Wrong credentials",
            });
            return;
        }

        res.json(result);
    } catch (error){
        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
            res.status(401).json({
                message: "Wrong credentials",
            });
            return;
        }

        console.error(error);
        res.status(500).json({message: "Internal server error"});
    }
}