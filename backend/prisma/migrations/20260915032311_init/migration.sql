-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('admin', 'warehouse_manager', 'staff');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'locked');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('active', 'discontinued');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('text', 'integer', 'decimal', 'boolean');

-- CreateEnum
CREATE TYPE "PcConfigStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ImportOrderStatus" AS ENUM ('draft', 'confirmed');

-- CreateEnum
CREATE TYPE "ExportOrderType" AS ENUM ('material', 'finished_product');

-- CreateEnum
CREATE TYPE "ExportOrderStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('pending', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100),
    "email" VARCHAR(100),
    "phone" VARCHAR(20),
    "role" "AccountRole" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "component_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "components" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20),
    "unit_price" DECIMAL(12,2) NOT NULL,
    "min_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "status" "ComponentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_definitions" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "data_type" "AttributeDataType" NOT NULL,
    "unit" VARCHAR(20),
    "is_required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_attributes" (
    "id" SERIAL NOT NULL,
    "component_id" INTEGER NOT NULL,
    "attribute_definition_id" INTEGER NOT NULL,
    "value" VARCHAR(255) NOT NULL,

    CONSTRAINT "component_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_configs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sale_price" DECIMAL(12,2) NOT NULL,
    "status" "PcConfigStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pc_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" SERIAL NOT NULL,
    "pc_config_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_orders" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "note" TEXT,
    "status" "ImportOrderStatus" NOT NULL DEFAULT 'confirmed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_order_items" (
    "id" SERIAL NOT NULL,
    "import_order_id" INTEGER NOT NULL,
    "component_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "import_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_orders" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "type" "ExportOrderType" NOT NULL,
    "requested_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "status" "ExportOrderStatus" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "export_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_order_items" (
    "id" SERIAL NOT NULL,
    "export_order_id" INTEGER NOT NULL,
    "component_id" INTEGER,
    "pc_config_id" INTEGER,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "export_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" SERIAL NOT NULL,
    "pc_config_id" INTEGER NOT NULL,
    "quantity_requested" INTEGER NOT NULL,
    "assigned_to" INTEGER,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'pending',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_table" VARCHAR(50),
    "target_id" INTEGER,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "component_categories_name_key" ON "component_categories"("name");

-- CreateIndex
CREATE INDEX "components_category_id_idx" ON "components"("category_id");

-- CreateIndex
CREATE INDEX "attribute_definitions_category_id_idx" ON "attribute_definitions"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definitions_category_id_name_key" ON "attribute_definitions"("category_id", "name");

-- CreateIndex
CREATE INDEX "component_attributes_component_id_idx" ON "component_attributes"("component_id");

-- CreateIndex
CREATE INDEX "component_attributes_attribute_definition_id_idx" ON "component_attributes"("attribute_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "component_attributes_component_id_attribute_definition_id_key" ON "component_attributes"("component_id", "attribute_definition_id");

-- CreateIndex
CREATE INDEX "bom_items_pc_config_id_idx" ON "bom_items"("pc_config_id");

-- CreateIndex
CREATE INDEX "bom_items_component_id_idx" ON "bom_items"("component_id");

-- CreateIndex
CREATE UNIQUE INDEX "bom_items_pc_config_id_component_id_key" ON "bom_items"("pc_config_id", "component_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_component_id_key" ON "inventory"("component_id");

-- CreateIndex
CREATE UNIQUE INDEX "import_orders_code_key" ON "import_orders"("code");

-- CreateIndex
CREATE INDEX "import_orders_created_by_idx" ON "import_orders"("created_by");

-- CreateIndex
CREATE INDEX "import_order_items_import_order_id_idx" ON "import_order_items"("import_order_id");

-- CreateIndex
CREATE INDEX "import_order_items_component_id_idx" ON "import_order_items"("component_id");

-- CreateIndex
CREATE UNIQUE INDEX "export_orders_code_key" ON "export_orders"("code");

-- CreateIndex
CREATE INDEX "export_orders_requested_by_idx" ON "export_orders"("requested_by");

-- CreateIndex
CREATE INDEX "export_orders_approved_by_idx" ON "export_orders"("approved_by");

-- CreateIndex
CREATE INDEX "export_order_items_export_order_id_idx" ON "export_order_items"("export_order_id");

-- CreateIndex
CREATE INDEX "export_order_items_component_id_idx" ON "export_order_items"("component_id");

-- CreateIndex
CREATE INDEX "export_order_items_pc_config_id_idx" ON "export_order_items"("pc_config_id");

-- CreateIndex
CREATE INDEX "production_orders_pc_config_id_idx" ON "production_orders"("pc_config_id");

-- CreateIndex
CREATE INDEX "production_orders_assigned_to_idx" ON "production_orders"("assigned_to");

-- CreateIndex
CREATE INDEX "production_orders_created_by_idx" ON "production_orders"("created_by");

-- CreateIndex
CREATE INDEX "refresh_tokens_account_id_idx" ON "refresh_tokens"("account_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "audit_logs_account_id_idx" ON "audit_logs"("account_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "components" ADD CONSTRAINT "components_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "component_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "component_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_attributes" ADD CONSTRAINT "component_attributes_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_attributes" ADD CONSTRAINT "component_attributes_attribute_definition_id_fkey" FOREIGN KEY ("attribute_definition_id") REFERENCES "attribute_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_pc_config_id_fkey" FOREIGN KEY ("pc_config_id") REFERENCES "pc_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_order_items" ADD CONSTRAINT "import_order_items_import_order_id_fkey" FOREIGN KEY ("import_order_id") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_order_items" ADD CONSTRAINT "import_order_items_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_export_order_id_fkey" FOREIGN KEY ("export_order_id") REFERENCES "export_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_pc_config_id_fkey" FOREIGN KEY ("pc_config_id") REFERENCES "pc_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_pc_config_id_fkey" FOREIGN KEY ("pc_config_id") REFERENCES "pc_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
