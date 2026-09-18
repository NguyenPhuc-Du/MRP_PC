-- 1) Bảng danh mục
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- 2) Linh kiện: cột optional — không đụng dữ liệu cũ
ALTER TABLE "components" ADD COLUMN "brand_id" INTEGER;
ALTER TABLE "components" ADD COLUMN "supplier_id" INTEGER;

ALTER TABLE "components"
  ADD CONSTRAINT "components_brand_id_fkey"
  FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "components"
  ADD CONSTRAINT "components_supplier_id_fkey"
  FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "components_brand_id_idx" ON "components"("brand_id");
CREATE INDEX "components_supplier_id_idx" ON "components"("supplier_id");

-- 3) Phiếu nhập: NULL được → 3 dòng cũ không chặn migrate
ALTER TABLE "import_orders" ADD COLUMN "supplier_id" INTEGER;

ALTER TABLE "import_orders"
  ADD CONSTRAINT "import_orders_supplier_id_fkey"
  FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "import_orders_supplier_id_idx" ON "import_orders"("supplier_id");