import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import { sanitizePermissions, sanitizeRoleId, type RolePermissionPayload } from "../constants/permissions";
import * as permissionService from "../services/permission.service";

const parsePayload = (raw: unknown): RolePermissionPayload[] => {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(data)) {
        throw new Error("INVALID_PERMISSIONS");
    }

    return data.flatMap((item) => {
        const id = sanitizeRoleId(item?.id);
        if (!id) {
            return [];
        }
        return [{
            id,
            permissions: sanitizePermissions(item?.permissions),
        }];
    });
};

export const index = async (req: Request, res: Response): Promise<void> => {
    const records = await permissionService.getRoles();

    res.render("pages/permissions/index", {
        pageTitle: "Phân quyền",
        records,
    });
};

export const permissionsPatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = parsePayload(req.body.permissions);
        await permissionService.updatePermissions(payload);
        req.flash("success", "Cập nhật phân quyền thành công");
    } catch {
        req.flash("error", "Cập nhật phân quyền thất bại");
    }

    res.redirect(`${systemConfig.prefixAdmin}/permissions`);
};
