import { Request, Response } from "express";
import * as productionService from "../services/production.service";

export async function getMyOders(req: Request, res: Response): Promise<void> {
    try {
        const accountId = req.authUser?.accountId;

        if (!accountId) {
            res.status(401).json({
                message: "Authentication is required",
            });

            return;
        }

        const orders = await productionService.getMyOders(accountId);

        res.json({
            data: orders,
        });
    }
    catch(error) {
        console.error(error);

        res.status(500).json({
            message: "internal server error",
        });
    }
}

export async function getMyOrderById(req: Request, res: Response): Promise<void> {
    try {
        const accountId = req.authUser?.accountId;
        const orderId = Number(req.params.id);

        if (!accountId) {
            res.status(401).json({
                message: "Authentication is required"
            });

            return;
        }

        if (Number.isInteger(orderId) || orderId <= 0) {
            res.status(400).json({
                message: "Invalid order Id"
            });

            return;
        }

        const order = await productionService.getMyOrderById(accountId, orderId);

        if (!order) {
            res.status(404).json({
                message: "Order not found"
            });

            return;
        }

        res.json({
            data: order,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}