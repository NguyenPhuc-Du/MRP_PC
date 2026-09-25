import type { AccountRole } from "../generated/prisma/index.js";

export const PERMISSION_KEYS = [
  "dashboard_view",
  "components_view",
  "components_create",
  "components_edit",
  "components_delete",
  "inventory_view",
  "inventory_edit",
  "importOrders_view",
  "importOrders_create",
  "importOrders_edit",
  "importOrders_delete",
  "exportOrders_view",
  "exportOrders_create",
  "exportOrders_edit",
  "exportOrders_delete",
  "exportOrders_approve",
  "bom_view",
  "bom_create",
  "bom_edit",
  "bom_delete",
  "production_view",
  "production_create",
  "production_edit",
  "production_delete",
  "reports_view",
  "account_view",
  "account_create",
  "account_edit",
  "account_lock",
  "roles_view",
  "roles_create",
  "roles_edit",
  "roles_delete",
  "roles_permissions",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ROLE_ORDER: AccountRole[] = [
  "admin",
  "warehouse_manager",
  "staff",
];

export const ROLE_LABELS: Record<AccountRole, string> = {
  admin: "Admin",
  warehouse_manager: "Quản lý kho",
  staff: "Nhân viên lắp ráp",
};

const isAccountRole = (value: unknown): value is AccountRole => {
  return typeof value === "string" && (ROLE_ORDER as string[]).includes(value);
};

const isPermissionKey = (value: unknown): value is PermissionKey => {
  return (
    typeof value === "string" &&
    (PERMISSION_KEYS as readonly string[]).includes(value)
  );
};

export const sanitizePermissions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter(isPermissionKey))];
};

export const sanitizeRoleId = (value: unknown): AccountRole | null => {
  if (isAccountRole(value)) {
    return value;
  }
  return null;
};

export type RolePermissionPayload = {
  id: AccountRole;
  permissions: string[];
};

export const ADMIN_PERMISSIONS: PermissionKey[] = [
  "account_view",
  "account_create",
  "account_edit",
  "account_lock",
  "roles_view",
  "roles_create",
  "roles_edit",
  "roles_delete",
  "roles_permissions",
];

export const WAREHOUSE_MANAGER_PERMISSIONS: PermissionKey[] = [
  "dashboard_view",
  "components_view",
  "components_create",
  "components_edit",
  "components_delete",
  "importOrders_view",
  "importOrders_create",
  "importOrders_edit",
  "importOrders_delete",
  "exportOrders_view",
  "exportOrders_create",
  "exportOrders_edit",
  "exportOrders_delete",
  "exportOrders_approve",
  "bom_view",
  "bom_create",
  "bom_edit",
  "bom_delete",
  "production_view",
  "production_create",
  "production_edit",
  "production_delete",
  "reports_view",
];

/** Chỉ các *_view đã có route admin + requirePermission. Thứ tự = sidebar. */
export const VIEW_LANDING: Array<{ key: PermissionKey; path: string }> = [
  { key: "components_view", path: "/components" },
  { key: "importOrders_view", path: "/importOrders" },
  { key: "exportOrders_view", path: "/exportOrders" },
  { key: "bom_view", path: "/bom" },
  { key: "account_view", path: "/accounts" },
  { key: "roles_view", path: "/permissions" },
];

export const firstViewPath = (
  permissions: string[] | undefined,
  prefix: string,
): string | null => {
  const keys = Array.isArray(permissions) ? permissions : [];
  const hit = VIEW_LANDING.find((item) => keys.includes(item.key));
  return hit ? `${prefix}${hit.path}` : null;
};

export const DEFAULT_ROLES: Array<{
  id: AccountRole;
  permissions: string[];
}> = [
  {
    id: "admin",
    permissions: [...ADMIN_PERMISSIONS],
  },
  {
    id: "warehouse_manager",
    permissions: [...WAREHOUSE_MANAGER_PERMISSIONS],
  },
  {
    id: "staff",
    permissions: [],
  },
];
