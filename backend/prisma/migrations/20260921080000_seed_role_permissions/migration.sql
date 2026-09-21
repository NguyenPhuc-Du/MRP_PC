-- Default permissions for admin and warehouse_manager.
-- Staff is left empty on purpose.

INSERT INTO "roles" ("id", "permissions")
VALUES (
    'admin'::"AccountRole",
    ARRAY[
        'account_view',
        'account_create',
        'account_edit',
        'account_lock',
        'roles_view',
        'roles_permissions'
    ]::TEXT[]
)
ON CONFLICT ("id") DO UPDATE
SET "permissions" = EXCLUDED."permissions";

INSERT INTO "roles" ("id", "permissions")
VALUES (
    'warehouse_manager'::"AccountRole",
    ARRAY[
        'dashboard_view',
        'components_view',
        'components_create',
        'components_edit',
        'components_delete',
        'importOrders_view',
        'importOrders_create',
        'importOrders_edit',
        'importOrders_delete',
        'exportOrders_view',
        'exportOrders_create',
        'exportOrders_edit',
        'exportOrders_delete',
        'exportOrders_approve',
        'bom_view',
        'bom_create',
        'bom_edit',
        'bom_delete',
        'production_view',
        'production_create',
        'production_edit',
        'production_delete',
        'reports_view'
    ]::TEXT[]
)
ON CONFLICT ("id") DO UPDATE
SET "permissions" = EXCLUDED."permissions";
