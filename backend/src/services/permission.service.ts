import { prisma } from "../config/database";
import {
    ADMIN_PERMISSIONS,
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
    const sortedLeft = [...left].sort();
    const sortedRight = [...right].sort();
    return sortedLeft.every((key, index) => key === sortedRight[index]);
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

    await Promise.all(
        rows.map(async (row) => {
            const cleaned = sanitizePermissions(row.permissions);
            // Admin luôn cố định full quyền hệ thống.
            const next =
                row.id === "admin"
                    ? [...ADMIN_PERMISSIONS]
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
        permissions:
            id === "admin"
                ? [...ADMIN_PERMISSIONS]
                : sanitizePermissions(byId.get(id)?.permissions ?? []),
    }));
};

export const updatePermissions = async (payload: RolePermissionPayload[]): Promise<void> => {
    await prisma.$transaction(
        payload.map((item) =>
            prisma.role.update({
                where: { id: item.id },
                data: {
                    // Admin luôn giữ full quyền, không cho đổi từ trang Phân quyền.
                    permissions:
                        item.id === "admin"
                            ? [...ADMIN_PERMISSIONS]
                            : sanitizePermissions(item.permissions),
                },
            }),
        ),
    );
};
