-- Admin can create and download database dumps.
UPDATE "roles"
SET "permissions" = "permissions" || ARRAY['backup_view', 'backup_create']::TEXT[]
WHERE "id" = 'admin'::"AccountRole"
  AND NOT ('backup_view' = ANY("permissions"));
