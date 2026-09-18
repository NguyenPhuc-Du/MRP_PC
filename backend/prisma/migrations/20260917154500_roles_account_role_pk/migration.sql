-- Recreate roles as the 3 fixed AccountRole keys
CREATE TABLE "roles_fixed" (
    "id" "AccountRole" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "roles_fixed_pkey" PRIMARY KEY ("id")
);

INSERT INTO "roles_fixed" ("id", "permissions", "updated_at")
SELECT mapped_id, permissions, updated_at
FROM (
    SELECT
        CASE
            WHEN title = 'Admin' THEN 'admin'::"AccountRole"
            WHEN title = 'Quản lý kho' THEN 'warehouse_manager'::"AccountRole"
            WHEN title = 'Nhân viên lắp ráp' THEN 'staff'::"AccountRole"
        END AS mapped_id,
        permissions,
        updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY CASE
                WHEN title = 'Admin' THEN 'admin'
                WHEN title = 'Quản lý kho' THEN 'warehouse_manager'
                WHEN title = 'Nhân viên lắp ráp' THEN 'staff'
            END
            ORDER BY id
        ) AS rn
    FROM "roles"
) src
WHERE mapped_id IS NOT NULL AND rn = 1;

INSERT INTO "roles_fixed" ("id", "permissions")
SELECT v.id, ARRAY[]::TEXT[]
FROM (
    VALUES
        ('admin'::"AccountRole"),
        ('warehouse_manager'::"AccountRole"),
        ('staff'::"AccountRole")
) AS v(id)
WHERE NOT EXISTS (
    SELECT 1 FROM "roles_fixed" r WHERE r.id = v.id
);

DROP TABLE "roles";
ALTER TABLE "roles_fixed" RENAME TO "roles";
