import { prisma } from "../config/database";
import {
    DEFAULT_ROLES,
    ROLE_LABELS,
    ROLE_ORDER,
    sanitizePermissions,
    type RolePermissionPayload,
} from "../constants/permissions";

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
        permissions: byId.get(id)?.permissions ?? [],
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
