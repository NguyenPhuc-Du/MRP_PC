-- Đồng bộ quyền Admin với ADMIN_PERMISSIONS (không có dashboard_view).
UPDATE "roles"
SET "permissions" = ARRAY[
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
