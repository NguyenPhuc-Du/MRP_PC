import { prisma } from "../config/database";
import {
    DEFAULT_ROLES,
    ROLE_LABELS,
    ROLE_ORDER,
    sanitizePermissions,
    type RolePermissionPayload,
} from "../constants/permissions";

const samePermissions = (left: string[], right: string[]): boolean => {
    if (left.length !== right.length) {
        return false;
    }
    return left.every((key, index) => key === right[index]);
};

export const ensureDefaultRoles = async (): Promise<void> => {
    await Promise.all(
        DEFAULT_ROLES.map((role) =>
            prisma.role.upsert({
                where: { id: role.id },
                update: {},
                create: {
                    id: role.id,
                    permissions: role.permissions,
                },
            }),
        ),
    );

    const rows = await prisma.role.findMany({
        select: { id: true, permissions: true },
    });

    const defaultsById = new Map(DEFAULT_ROLES.map((role) => [role.id, role.permissions]));

    await Promise.all(
        rows.map(async (row) => {
            const cleaned = sanitizePermissions(row.permissions);
            const defaults = defaultsById.get(row.id) ?? [];
            // Bản ghi admin cũ chưa có dashboard/sao lưu. Chỉ bù khi cả hai đều vắng,
            // để lần sửa quyền sau không bị ghi đè mỗi khi mở server.
            const shouldFillAdmin =
                row.id === "admin" &&
                !cleaned.includes("dashboard_view") &&
                !cleaned.includes("backup_view");
            const next = shouldFillAdmin
                ? [...new Set([...defaults, ...cleaned])]
                : cleaned;

            if (samePermissions(next, row.permissions)) {
                return;
            }
            await prisma.role.update({
                where: { id: row.id },
                data: { permissions: next },
            });
        }),
    );
};

export const getRoles = async () => {
    await ensureDefaultRoles();

    const rows = await prisma.role.findMany({
        select: {
            id: true,
            permissions: true,
        },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    return ROLE_ORDER.map((id) => ({
        id,
        title: ROLE_LABELS[id],
        permissions: sanitizePermissions(byId.get(id)?.permissions ?? []),
    }));
};

export const updatePermissions = async (payload: RolePermissionPayload[]): Promise<void> => {
    await prisma.$transaction(
        payload.map((item) =>
            prisma.role.update({
                where: { id: item.id },
                data: { permissions: sanitizePermissions(item.permissions) },
            }),
        ),
    );
};
