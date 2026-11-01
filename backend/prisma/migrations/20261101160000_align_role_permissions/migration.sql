-- Quyền còn lại đều có route. Admin đủ phần hệ thống; quản lý kho đủ phần vận hành.

UPDATE "roles"
SET "permissions" = ARRAY[
    'dashboard_view',
    'account_view',
    'account_create',
    'account_edit',
    'account_lock',
    'roles_view',
    'roles_permissions',
    'backup_view',
    'backup_create'
]::TEXT[]
WHERE "id" = 'admin'::"AccountRole";

UPDATE "roles"
SET "permissions" = ARRAY[
    'dashboard_view',
    'components_view',
    'components_create',
    'components_edit',
    'components_delete',
    'importOrders_view',
    'importOrders_create',
    'importOrders_edit',
    'exportOrders_view',
    'exportOrders_approve',
    'bom_view',
    'bom_create',
    'bom_edit',
    'production_view',
    'production_create',
    'production_delete'
]::TEXT[]
WHERE "id" = 'warehouse_manager'::"AccountRole";
