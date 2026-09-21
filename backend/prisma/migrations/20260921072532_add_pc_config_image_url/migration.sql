-- DropIndex
DROP INDEX "components_brand_id_idx";

-- DropIndex
DROP INDEX "components_supplier_id_idx";

-- AlterTable
ALTER TABLE "pc_configs" ADD COLUMN     "image_url" VARCHAR(500);
