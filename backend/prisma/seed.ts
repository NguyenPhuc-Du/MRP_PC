
import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";
import { syncComponentImagesFromR2 } from "../src/utils/sync-r2-images";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.account.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      fullName: "Quản trị viên",
      email: "admin@mrp.local",
      role: "admin",
    },
  });

  await prisma.account.upsert({
    where: { username: "warehouse" },
    update: {},
    create: {
      username: "warehouse",
      passwordHash,
      fullName: "Quản lý kho",
      email: "warehouse@mrp.local",
      role: "warehouse_manager",
    },
  });

  await prisma.account.upsert({
    where: { username: "staff" },
    update: {},
    create: {
      username: "staff",
      passwordHash,
      fullName: "Nhân viên lắp ráp",
      email: "staff@mrp.local",
      role: "staff",
    },
  });

  const categoryNames = [
    { name: "CPU", description: "Bộ vi xử lý" },
    { name: "Mainboard", description: "Bo mạch chủ" },
    { name: "Ram", description: "Bộ nhớ trong" },
    { name: "GPU", description: "Card đồ họa" },
    { name: "PSU", description: "Nguồn máy tính" },
    { name: "SSD", description: "Ổ cứng SSD" },
    { name: "HDD", description: "Ổ cứng HDD" },
    { name: "Case", description: "Vỏ case" },
    { name: "Fan", description: "Quạt tản nhiệt" },
  ];

  const categories = new Map<string, number>();
  for (const item of categoryNames) {
    const row = await prisma.componentCategory.upsert({
      where: { name: item.name },
      update: { description: item.description },
      create: item,
    });
    categories.set(item.name, row.id);
  }

  const cpuId = categories.get("CPU")!;
  const ramId = categories.get("Ram")!;
  const psuId = categories.get("PSU")!;

  const socketAttr = await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: cpuId, name: "socket" } },
    update: {},
    create: { categoryId: cpuId, name: "socket", dataType: "text", isRequired: true },
  });

  const cpuWattAttr = await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: cpuId, name: "power_watt" } },
    update: {},
    create: {
      categoryId: cpuId,
      name: "power_watt",
      dataType: "integer",
      unit: "W",
      isRequired: true,
    },
  });

  const ramTypeAttr = await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: ramId, name: "ram_type" } },
    update: {},
    create: { categoryId: ramId, name: "ram_type", dataType: "text", isRequired: true },
  });

  await prisma.attributeDefinition.upsert({
    where: { categoryId_name: { categoryId: psuId, name: "power_watt" } },
    update: {},
    create: {
      categoryId: psuId,
      name: "power_watt",
      dataType: "integer",
      unit: "W",
      isRequired: true,
    },
  });

  const cpu = await prisma.component.upsert({
    where: { id: 1 },
    update: {},
    create: {
      categoryId: cpuId,
      name: "CPU Intel i5-13400",
      unit: "cái",
      unitPrice: 5200000,
      minStockThreshold: 5,
      attributes: {
        create: [
          { attributeDefinitionId: socketAttr.id, value: "LGA1700" },
          { attributeDefinitionId: cpuWattAttr.id, value: "65" },
        ],
      },
      inventory: { create: { quantityOnHand: 10 } },
    },
  });

  const ram = await prisma.component.upsert({
    where: { id: 2 },
    update: {},
    create: {
      categoryId: ramId,
      name: "RAM Kingston Fury 16GB",
      unit: "thanh",
      unitPrice: 1450000,
      minStockThreshold: 8,
      attributes: {
        create: [{ attributeDefinitionId: ramTypeAttr.id, value: "DDR5" }],
      },
      inventory: { create: { quantityOnHand: 20 } },
    },
  });

  const officePc = await prisma.pcConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "PC Văn phòng",
      description: "Cấu hình văn phòng cơ bản",
      salePrice: 12900000,
      bomItems: {
        create: [
          { componentId: cpu.id, quantity: 1 },
          { componentId: ram.id, quantity: 2 },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      accountId: admin.id,
      action: "seed_database",
      targetTable: "pc_configs",
      targetId: officePc.id,
      detail: "Khoi tao du lieu mau theo tai lieu thiet ke CSDL",
    },
  });

  const images = await syncComponentImagesFromR2(prisma);
  console.log(
    `Seed xong. Tai khoan mau: admin / warehouse / staff — mat khau: admin123. Anh R2: tao ${images.created}, cap nhat ${images.updated}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
