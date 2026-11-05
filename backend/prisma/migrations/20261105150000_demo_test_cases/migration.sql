-- Dữ liệu demo để test đồ án MRP PC.
-- Mật khẩu mọi tài khoản tạo ở đây: admin123
-- Chạy lại an toàn: mỗi tình huống chỉ được chèn khi chưa có mã / tên tương ứng.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  pwd text := crypt('admin123', gen_salt('bf', 10));
  admin_id int;
  warehouse_id int;
  staff_id int;
  staff2_id int;
  cat_cpu int;
  cat_ram int;
  cat_gpu int;
  cat_ssd int;
  cat_case int;
  cat_hdd int;
  cat_main int;
  cat_psu int;
  brand_intel int;
  brand_kingston int;
  brand_nvidia int;
  brand_samsung int;
  sup_anphat int;
  cpu_id int;
  ram_id int;
  gpu_id int;
  ssd_id int;
  case_id int;
  hdd_id int;
  main_id int;
  psu_id int;
  office_id int;
  gaming_id int;
  inactive_id int;
  order_id int;
BEGIN
  -- Tài khoản
  INSERT INTO accounts (username, password_hash, full_name, email, phone, role, status)
  SELECT 'admin', pwd, 'Quản trị viên', 'admin@mrp.local', '0901000001', 'admin', 'active'
  WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'admin');

  INSERT INTO accounts (username, password_hash, full_name, email, phone, role, status)
  SELECT 'warehouse', pwd, 'Quản lý kho', 'warehouse@mrp.local', '0901000002', 'warehouse_manager', 'active'
  WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'warehouse');

  INSERT INTO accounts (username, password_hash, full_name, email, phone, role, status)
  SELECT 'staff', pwd, 'Nhân viên lắp ráp', 'staff@mrp.local', '0901000003', 'staff', 'active'
  WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'staff');

  INSERT INTO accounts (username, password_hash, full_name, email, phone, role, status)
  SELECT 'staff2', pwd, 'Nhân viên lắp ráp 2', 'staff2@mrp.local', '0901000004', 'staff', 'active'
  WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'staff2');

  INSERT INTO accounts (username, password_hash, full_name, email, phone, role, status)
  SELECT 'staff_locked', pwd, 'Nhân viên bị khóa', 'staff.locked@mrp.local', '0901000005', 'staff', 'locked'
  WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE username = 'staff_locked');

  UPDATE accounts SET status = 'locked' WHERE username = 'staff_locked';

  SELECT id INTO admin_id FROM accounts WHERE username = 'admin';
  SELECT id INTO warehouse_id FROM accounts WHERE username = 'warehouse';
  SELECT id INTO staff_id FROM accounts WHERE username = 'staff';
  SELECT id INTO staff2_id FROM accounts WHERE username = 'staff2';

  -- Danh mục
  INSERT INTO component_categories (name, description)
  SELECT v.name, v.description
  FROM (VALUES
    ('CPU', 'Bộ vi xử lý'),
    ('Mainboard', 'Bo mạch chủ'),
    ('RAM', 'Bộ nhớ trong'),
    ('GPU', 'Card đồ họa'),
    ('PSU', 'Nguồn máy tính'),
    ('SSD', 'Ổ cứng SSD'),
    ('HDD', 'Ổ cứng HDD'),
    ('Case', 'Vỏ case')
  ) AS v(name, description)
  WHERE NOT EXISTS (SELECT 1 FROM component_categories c WHERE c.name = v.name);

  SELECT id INTO cat_cpu FROM component_categories WHERE name = 'CPU';
  SELECT id INTO cat_ram FROM component_categories WHERE name = 'RAM';
  SELECT id INTO cat_gpu FROM component_categories WHERE name = 'GPU';
  SELECT id INTO cat_ssd FROM component_categories WHERE name = 'SSD';
  SELECT id INTO cat_case FROM component_categories WHERE name = 'Case';
  SELECT id INTO cat_hdd FROM component_categories WHERE name = 'HDD';
  SELECT id INTO cat_main FROM component_categories WHERE name = 'Mainboard';
  SELECT id INTO cat_psu FROM component_categories WHERE name = 'PSU';

  INSERT INTO brands (name)
  SELECT v.name FROM (VALUES ('Intel'), ('Kingston'), ('NVIDIA'), ('Samsung'), ('Corsair')) AS v(name)
  WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE b.name = v.name);

  INSERT INTO suppliers (name, phone, email, address)
  SELECT 'An Phát', '02811112222', 'anphat@mrp.local', 'Q.1, TP.HCM'
  WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'An Phát');

  INSERT INTO suppliers (name, phone, email, address)
  SELECT 'Phong Vũ', '02833334444', 'phongvu@mrp.local', 'Q.10, TP.HCM'
  WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Phong Vũ');

  SELECT id INTO brand_intel FROM brands WHERE name = 'Intel';
  SELECT id INTO brand_kingston FROM brands WHERE name = 'Kingston';
  SELECT id INTO brand_nvidia FROM brands WHERE name = 'NVIDIA';
  SELECT id INTO brand_samsung FROM brands WHERE name = 'Samsung';
  SELECT id INTO sup_anphat FROM suppliers WHERE name = 'An Phát';

  -- Linh kiện nền (trùng tên với seed thì không tạo thêm)
  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_cpu, 'CPU Intel i5-13400', 'cái', 5200000, 5, brand_intel, sup_anphat, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'CPU Intel i5-13400');

  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_ram, 'RAM Kingston Fury 16GB', 'thanh', 1450000, 8, brand_kingston, sup_anphat, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'RAM Kingston Fury 16GB');

  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_gpu, 'GPU RTX 4060 8GB', 'cái', 8900000, 2, brand_nvidia, sup_anphat, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'GPU RTX 4060 8GB');

  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_ssd, 'SSD Samsung 990 1TB', 'cái', 2800000, 4, brand_samsung, sup_anphat, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'SSD Samsung 990 1TB');

  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_case, 'Case ATX Mid Tower', 'cái', 890000, 8, NULL, sup_anphat, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'Case ATX Mid Tower');

  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_hdd, 'HDD WD 1TB (ngừng kinh doanh)', 'cái', 950000, 2, NULL, sup_anphat, 'discontinued'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'HDD WD 1TB (ngừng kinh doanh)');

  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_main, 'Mainboard B760M', 'cái', 3200000, 3, brand_intel, sup_anphat, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'Mainboard B760M');

  INSERT INTO components (category_id, name, unit, unit_price, min_stock_threshold, brand_id, supplier_id, status)
  SELECT cat_psu, 'PSU 650W', 'cái', 1450000, 3, NULL, sup_anphat, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM components WHERE name = 'PSU 650W');

  SELECT id INTO cpu_id FROM components WHERE name = 'CPU Intel i5-13400' ORDER BY id LIMIT 1;
  SELECT id INTO ram_id FROM components WHERE name = 'RAM Kingston Fury 16GB' ORDER BY id LIMIT 1;
  SELECT id INTO gpu_id FROM components WHERE name = 'GPU RTX 4060 8GB' ORDER BY id LIMIT 1;
  SELECT id INTO ssd_id FROM components WHERE name = 'SSD Samsung 990 1TB' ORDER BY id LIMIT 1;
  SELECT id INTO case_id FROM components WHERE name = 'Case ATX Mid Tower' ORDER BY id LIMIT 1;
  SELECT id INTO hdd_id FROM components WHERE name = 'HDD WD 1TB (ngừng kinh doanh)' ORDER BY id LIMIT 1;
  SELECT id INTO main_id FROM components WHERE name = 'Mainboard B760M' ORDER BY id LIMIT 1;
  SELECT id INTO psu_id FROM components WHERE name = 'PSU 650W' ORDER BY id LIMIT 1;

  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT cpu_id, 10, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = cpu_id);
  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT ram_id, 20, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = ram_id);
  -- Hết hàng: GPU và PSU
  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT gpu_id, 0, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = gpu_id);
  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT psu_id, 0, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = psu_id);
  -- Thiếu so với BOM (cần 2, chỉ có 1)
  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT ssd_id, 1, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = ssd_id);
  -- Dưới ngưỡng tối thiểu, vẫn còn hàng
  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT case_id, 2, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = case_id);
  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT hdd_id, 4, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = hdd_id);
  INSERT INTO inventory (component_id, quantity_on_hand, updated_at)
  SELECT main_id, 6, NOW() WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE component_id = main_id);

  -- Cấu hình
  INSERT INTO pc_configs (name, description, sale_price, status)
  SELECT 'PC Văn phòng', 'Cấu hình văn phòng cơ bản — đủ linh kiện', 12900000, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM pc_configs WHERE name = 'PC Văn phòng');

  INSERT INTO pc_configs (name, description, sale_price, status)
  SELECT 'PC Gaming thiếu linh kiện', 'GPU hết hàng, SSD không đủ định mức', 24500000, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM pc_configs WHERE name = 'PC Gaming thiếu linh kiện');

  INSERT INTO pc_configs (name, description, sale_price, status)
  SELECT 'PC Ngừng bán', 'Cấu hình inactive, không dùng cho lệnh mới', 9900000, 'inactive'
  WHERE NOT EXISTS (SELECT 1 FROM pc_configs WHERE name = 'PC Ngừng bán');

  SELECT id INTO office_id FROM pc_configs WHERE name = 'PC Văn phòng' ORDER BY id LIMIT 1;
  SELECT id INTO gaming_id FROM pc_configs WHERE name = 'PC Gaming thiếu linh kiện' ORDER BY id LIMIT 1;
  SELECT id INTO inactive_id FROM pc_configs WHERE name = 'PC Ngừng bán' ORDER BY id LIMIT 1;

  INSERT INTO bom_items (pc_config_id, component_id, quantity)
  SELECT office_id, cpu_id, 1
  WHERE NOT EXISTS (SELECT 1 FROM bom_items WHERE pc_config_id = office_id AND component_id = cpu_id);
  INSERT INTO bom_items (pc_config_id, component_id, quantity)
  SELECT office_id, ram_id, 2
  WHERE NOT EXISTS (SELECT 1 FROM bom_items WHERE pc_config_id = office_id AND component_id = ram_id);

  INSERT INTO bom_items (pc_config_id, component_id, quantity)
  SELECT gaming_id, cpu_id, 1
  WHERE NOT EXISTS (SELECT 1 FROM bom_items WHERE pc_config_id = gaming_id AND component_id = cpu_id);
  INSERT INTO bom_items (pc_config_id, component_id, quantity)
  SELECT gaming_id, gpu_id, 1
  WHERE NOT EXISTS (SELECT 1 FROM bom_items WHERE pc_config_id = gaming_id AND component_id = gpu_id);
  INSERT INTO bom_items (pc_config_id, component_id, quantity)
  SELECT gaming_id, ssd_id, 2
  WHERE NOT EXISTS (SELECT 1 FROM bom_items WHERE pc_config_id = gaming_id AND component_id = ssd_id);

  INSERT INTO bom_items (pc_config_id, component_id, quantity)
  SELECT inactive_id, cpu_id, 1
  WHERE NOT EXISTS (SELECT 1 FROM bom_items WHERE pc_config_id = inactive_id AND component_id = cpu_id);

  -- Lệnh chờ, đủ kho (nếu seed chưa tạo)
  IF NOT EXISTS (
    SELECT 1 FROM production_orders
    WHERE pc_config_id = office_id AND assigned_to = staff_id AND status = 'pending' AND deleted_at IS NULL
  ) THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by)
    VALUES (office_id, 1, staff_id, 'pending', admin_id);
  END IF;

  -- Lệnh chờ, thiếu linh kiện, chưa có phiếu xuất
  IF NOT EXISTS (
    SELECT 1 FROM production_orders
    WHERE pc_config_id = gaming_id AND assigned_to = staff_id AND status = 'pending' AND quantity_requested = 1 AND deleted_at IS NULL
  ) THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by)
    VALUES (gaming_id, 1, staff_id, 'pending', admin_id);
  END IF;

  -- Lệnh của staff2, cũng thiếu hàng
  IF NOT EXISTS (
    SELECT 1 FROM production_orders
    WHERE pc_config_id = gaming_id AND assigned_to = staff2_id AND deleted_at IS NULL
  ) THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by)
    VALUES (gaming_id, 1, staff2_id, 'pending', warehouse_id);
  END IF;

  -- Lệnh đã xóa mềm: app/web không hiện
  IF NOT EXISTS (
    SELECT 1 FROM production_orders
    WHERE pc_config_id = office_id AND assigned_to = staff_id AND deleted_at IS NOT NULL
  ) THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by, deleted_at)
    VALUES (office_id, 1, staff_id, 'pending', admin_id, NOW());
  END IF;

  -- Đang lắp + phiếu xuất NVL chờ duyệt (đủ kho, thủ kho bấm được Duyệt)
  IF NOT EXISTS (SELECT 1 FROM export_orders WHERE code = 'PXM-DEMO-PENDING') THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by)
    VALUES (office_id, 1, staff_id, 'in_progress', admin_id)
    RETURNING id INTO order_id;

    INSERT INTO export_orders (code, type, requested_by, status, note)
    VALUES ('PXM-DEMO-PENDING', 'material', staff_id, 'pending', 'PO#' || order_id || ' Xuất NVL cho lệnh lắp PC Văn phòng');

    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, cpu_id, 1 FROM export_orders WHERE code = 'PXM-DEMO-PENDING';
    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, ram_id, 2 FROM export_orders WHERE code = 'PXM-DEMO-PENDING';
  END IF;

  -- Đang lắp + phiếu NVL đã duyệt
  IF NOT EXISTS (SELECT 1 FROM export_orders WHERE code = 'PXM-DEMO-APPROVED') THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by)
    VALUES (office_id, 1, staff_id, 'in_progress', admin_id)
    RETURNING id INTO order_id;

    INSERT INTO export_orders (code, type, requested_by, approved_by, status, note, approved_at)
    VALUES ('PXM-DEMO-APPROVED', 'material', staff_id, warehouse_id, 'approved', 'PO#' || order_id || ' Xuất NVL cho lệnh lắp PC Văn phòng', NOW());

    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, cpu_id, 1 FROM export_orders WHERE code = 'PXM-DEMO-APPROVED';
    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, ram_id, 2 FROM export_orders WHERE code = 'PXM-DEMO-APPROVED';
  END IF;

  -- Đang lắp + phiếu NVL bị từ chối (nhân viên gửi lại được)
  IF NOT EXISTS (SELECT 1 FROM export_orders WHERE code = 'PXM-DEMO-REJECTED') THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by)
    VALUES (office_id, 1, staff_id, 'in_progress', admin_id)
    RETURNING id INTO order_id;

    INSERT INTO export_orders (code, type, requested_by, approved_by, status, note, approved_at)
    VALUES ('PXM-DEMO-REJECTED', 'material', staff_id, warehouse_id, 'rejected', 'PO#' || order_id || ' Xuất NVL cho lệnh lắp PC Văn phòng', NOW());

    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, cpu_id, 1 FROM export_orders WHERE code = 'PXM-DEMO-REJECTED';
    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, ram_id, 2 FROM export_orders WHERE code = 'PXM-DEMO-REJECTED';
  END IF;

  -- Thiếu hàng + phiếu NVL chờ duyệt (thủ kho không duyệt được vì stockOk = false)
  IF NOT EXISTS (SELECT 1 FROM export_orders WHERE code = 'PXM-DEMO-SHORT') THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by)
    VALUES (gaming_id, 1, staff_id, 'in_progress', admin_id)
    RETURNING id INTO order_id;

    INSERT INTO export_orders (code, type, requested_by, status, note)
    VALUES ('PXM-DEMO-SHORT', 'material', staff_id, 'pending', 'PO#' || order_id || ' Xuất NVL cho lệnh lắp PC Gaming thiếu linh kiện');

    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, cpu_id, 1 FROM export_orders WHERE code = 'PXM-DEMO-SHORT';
    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, gpu_id, 1 FROM export_orders WHERE code = 'PXM-DEMO-SHORT';
    INSERT INTO export_order_items (export_order_id, component_id, quantity)
    SELECT id, ssd_id, 2 FROM export_orders WHERE code = 'PXM-DEMO-SHORT';
  END IF;

  -- Đã lắp xong + phiếu xuất thành phẩm chờ duyệt
  IF NOT EXISTS (SELECT 1 FROM export_orders WHERE code = 'PXP-DEMO-PENDING') THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by, completed_at)
    VALUES (office_id, 1, staff_id, 'done', admin_id, NOW())
    RETURNING id INTO order_id;

    INSERT INTO export_orders (code, type, requested_by, status, note)
    VALUES ('PXP-DEMO-PENDING', 'finished_product', staff_id, 'pending', 'PO#' || order_id || ' Xuất thành phẩm PC Văn phòng');

    INSERT INTO export_order_items (export_order_id, pc_config_id, quantity)
    SELECT id, office_id, 1 FROM export_orders WHERE code = 'PXP-DEMO-PENDING';
  END IF;

  -- Đã lắp + phiếu thành phẩm đã duyệt
  IF NOT EXISTS (SELECT 1 FROM export_orders WHERE code = 'PXP-DEMO-APPROVED') THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by, completed_at)
    VALUES (office_id, 1, staff_id, 'done', admin_id, NOW())
    RETURNING id INTO order_id;

    INSERT INTO export_orders (code, type, requested_by, approved_by, status, note, approved_at)
    VALUES ('PXP-DEMO-APPROVED', 'finished_product', staff_id, warehouse_id, 'approved', 'PO#' || order_id || ' Xuất thành phẩm PC Văn phòng', NOW());

    INSERT INTO export_order_items (export_order_id, pc_config_id, quantity)
    SELECT id, office_id, 1 FROM export_orders WHERE code = 'PXP-DEMO-APPROVED';
  END IF;

  -- Đã lắp + phiếu thành phẩm bị từ chối (gửi lại được)
  IF NOT EXISTS (SELECT 1 FROM export_orders WHERE code = 'PXP-DEMO-REJECTED') THEN
    INSERT INTO production_orders (pc_config_id, quantity_requested, assigned_to, status, created_by, completed_at)
    VALUES (office_id, 1, staff_id, 'done', admin_id, NOW())
    RETURNING id INTO order_id;

    INSERT INTO export_orders (code, type, requested_by, approved_by, status, note, approved_at)
    VALUES ('PXP-DEMO-REJECTED', 'finished_product', staff_id, warehouse_id, 'rejected', 'PO#' || order_id || ' Xuất thành phẩm PC Văn phòng', NOW());

    INSERT INTO export_order_items (export_order_id, pc_config_id, quantity)
    SELECT id, office_id, 1 FROM export_orders WHERE code = 'PXP-DEMO-REJECTED';
  END IF;

  -- Phiếu nhập nháp: xác nhận sẽ cộng GPU và SSD, đủ để lắp PC Gaming
  IF NOT EXISTS (SELECT 1 FROM import_orders WHERE code = 'PN-DEMO-THIEU') THEN
    INSERT INTO import_orders (supplier_id, code, created_by, note, status)
    VALUES (sup_anphat, 'PN-DEMO-THIEU', warehouse_id, 'Nháp bù linh kiện thiếu cho PC Gaming', 'draft')
    RETURNING id INTO order_id;

    INSERT INTO import_order_items (import_order_id, component_id, quantity, unit_price)
    VALUES (order_id, gpu_id, 2, 8900000), (order_id, ssd_id, 4, 2800000);
  END IF;

  -- Phiếu nhập đã xác nhận (lịch sử, không cộng thêm tồn)
  IF NOT EXISTS (SELECT 1 FROM import_orders WHERE code = 'PN-DEMO-DA-NHAP') THEN
    INSERT INTO import_orders (supplier_id, code, created_by, note, status)
    VALUES (sup_anphat, 'PN-DEMO-DA-NHAP', warehouse_id, 'Phiếu nhập đã xác nhận từ trước', 'confirmed')
    RETURNING id INTO order_id;

    INSERT INTO import_order_items (import_order_id, component_id, quantity, unit_price)
    VALUES (order_id, case_id, 5, 890000);
  END IF;
END $$;
