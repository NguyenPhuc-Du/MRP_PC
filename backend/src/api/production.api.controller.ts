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

        if (!Number.isInteger(orderId) || orderId <= 0) {
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

export async function getOrderStock(req: Request, res: Response): Promise<void> {
    try {
        const accountId = req.authUser?.accountId;
        const orderId = Number(req.params.id);

        if (!accountId) {
            res.status(401).json({
                message: "Authentication is required",
            });
            return;
        }

        if (!Number.isInteger(orderId) || orderId <= 0) {
            res.status(400).json({
                message: "Invalid order id",
            });
            return;
        }

        const result = await productionService.getOrderStockCheck(accountId, orderId);

        if (!result) {
            res.status(404).json({
                message: "Order not found",
            });
            return;
        }

        res.json({
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}

const ASSEMBLE_ERRORS: Record<string, { status: number; message: string }> = {
    ORDER_DONE: { status: 400, message: "Lệnh đã hoàn thành" },
    MATERIAL_EXPORT_EXISTS: { status: 400, message: "Đã có phiếu xuất linh kiện đang chờ hoặc đã duyệt" },
    PRODUCT_EXPORT_EXISTS: { status: 400, message: "Đã có phiếu xuất thành phẩm đang chờ hoặc đã duyệt" },
    NO_BOM: { status: 400, message: "Cấu hình PC chưa có BOM" },
    STOCK_NOT_ENOUGH: { status: 400, message: "Không đủ linh kiện trong kho" },
    ORDER_NOT_DONE: { status: 400, message: "Cần xác nhận lắp xong trước khi xuất thành phẩm" },
};

function getAccountAndOrderId(req: Request): { accountId?: number; orderId: number } {
    return {
        accountId: req.authUser?.accountId,
        orderId: Number(req.params.id),
    };
}

function handleAssembleError(res: Response, error: unknown): boolean {
    if (error instanceof Error && ASSEMBLE_ERRORS[error.message]) {
        const mapped = ASSEMBLE_ERRORS[error.message];
        res.status(mapped.status).json({ message: mapped.message, code: error.message });
        return true;
    }
    return false;
}

export async function getAssembleStatus(req: Request, res: Response): Promise<void> {
    try {
        const { accountId, orderId } = getAccountAndOrderId(req);

        if (!accountId) {
            res.status(401).json({ message: "Authentication is required" });
            return;
        }

        if (!Number.isInteger(orderId) || orderId <= 0) {
            res.status(400).json({ message: "Invalid order id" });
            return;
        }

        const result = await productionService.getAssembleStatus(accountId, orderId);

        if (!result) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.json({ data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function requestMaterialExport(req: Request, res: Response): Promise<void> {
    try {
        const { accountId, orderId } = getAccountAndOrderId(req);

        if (!accountId) {
            res.status(401).json({ message: "Authentication is required" });
            return;
        }

        if (!Number.isInteger(orderId) || orderId <= 0) {
            res.status(400).json({ message: "Invalid order id" });
            return;
        }

        const result = await productionService.requestMaterialExport(accountId, orderId);

        if (!result) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.status(201).json({ data: result });
    } catch (error) {
        if (handleAssembleError(res, error)) {
            return;
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function confirmAssemble(req: Request, res: Response): Promise<void> {
    try {
        const { accountId, orderId } = getAccountAndOrderId(req);

        if (!accountId) {
            res.status(401).json({ message: "Authentication is required" });
            return;
        }

        if (!Number.isInteger(orderId) || orderId <= 0) {
            res.status(400).json({ message: "Invalid order id" });
            return;
        }

        const result = await productionService.confirmAssemble(accountId, orderId);

        if (!result) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.json({ data: result });
    } catch (error) {
        if (handleAssembleError(res, error)) {
            return;
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function requestProductExport(req: Request, res: Response): Promise<void> {
    try {
        const { accountId, orderId } = getAccountAndOrderId(req);

        if (!accountId) {
            res.status(401).json({ message: "Authentication is required" });
            return;
        }

        if (!Number.isInteger(orderId) || orderId <= 0) {
            res.status(400).json({ message: "Invalid order id" });
            return;
        }

        const result = await productionService.requestProductExport(accountId, orderId);

        if (!result) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.status(201).json({ data: result });
    } catch (error) {
        if (handleAssembleError(res, error)) {
            return;
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}