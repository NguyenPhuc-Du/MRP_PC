-- AlterTable
ALTER TABLE "components" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "roles" RENAME CONSTRAINT "roles_fixed_pkey" TO "roles_pkey";
