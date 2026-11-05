CREATE TABLE "product_inventory" (
    "id" SERIAL NOT NULL,
    "pc_config_id" INTEGER NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_inventory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_inventory_pc_config_id_key" ON "product_inventory"("pc_config_id");

ALTER TABLE "product_inventory"
ADD CONSTRAINT "product_inventory_pc_config_id_fkey"
FOREIGN KEY ("pc_config_id") REFERENCES "pc_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "product_inventory" ("pc_config_id", "quantity_on_hand", "updated_at")
SELECT
    produced."pc_config_id",
    GREATEST(0, produced.qty - COALESCE(shipped.qty, 0)),
    CURRENT_TIMESTAMP
FROM (
    SELECT "pc_config_id", SUM("quantity_requested")::int AS qty
    FROM "production_orders"
    WHERE "status" = 'done' AND "deleted_at" IS NULL
    GROUP BY "pc_config_id"
) AS produced
LEFT JOIN (
    SELECT i."pc_config_id", SUM(i."quantity")::int AS qty
    FROM "export_order_items" i
    INNER JOIN "export_orders" o ON o."id" = i."export_order_id"
    WHERE o."type" = 'finished_product'
      AND o."status" = 'approved'
      AND i."pc_config_id" IS NOT NULL
    GROUP BY i."pc_config_id"
) AS shipped ON shipped."pc_config_id" = produced."pc_config_id";
