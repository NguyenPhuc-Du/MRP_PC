import { PrismaClient } from "../generated/prisma/index.js";
import { listComponentObjects, r2PublicUrl } from "../config/r2";

type CatalogItem = {
  name: string;
  unit: string;
  unitPrice: number;
  minStockThreshold: number;
  quantityOnHand: number;
};

const FOLDER_TO_CATEGORY: Record<string, { name: string; description: string }> = {
  CPU: { name: "CPU", description: "Bộ vi xử lý" },
  Mainboard: { name: "Mainboard", description: "Bo mạch chủ" },
  Ram: { name: "RAM", description: "Bộ nhớ trong" },
  GPU: { name: "GPU", description: "Card đồ họa" },
  PSU: { name: "PSU", description: "Nguồn máy tính" },
  SSD: { name: "SSD", description: "Ổ cứng SSD" },
  HDD: { name: "HDD", description: "Ổ cứng HDD" },
  Case: { name: "Case", description: "Vỏ case" },
  Fan: { name: "Fan", description: "Quạt tản nhiệt" },
};

const CATALOG: Record<string, Record<string, CatalogItem>> = {
  CPU: {
    "1": { name: "CPU Intel i5-13400", unit: "cái", unitPrice: 5200000, minStockThreshold: 5, quantityOnHand: 10 },
    "2": { name: "CPU Intel i7-14700K", unit: "cái", unitPrice: 10490000, minStockThreshold: 4, quantityOnHand: 8 },
    "3": { name: "CPU AMD Ryzen 5 7600", unit: "cái", unitPrice: 5890000, minStockThreshold: 5, quantityOnHand: 12 },
    "4": { name: "CPU AMD Ryzen 7 7800X3D", unit: "cái", unitPrice: 11990000, minStockThreshold: 3, quantityOnHand: 6 },
  },
  Mainboard: {
    "1": { name: "Mainboard MSI PRO B760M", unit: "cái", unitPrice: 4290000, minStockThreshold: 5, quantityOnHand: 9 },
    "2": { name: "Mainboard Gigabyte B650", unit: "cái", unitPrice: 4590000, minStockThreshold: 5, quantityOnHand: 7 },
    "3": { name: "Mainboard ASUS TUF Z790", unit: "cái", unitPrice: 6890000, minStockThreshold: 4, quantityOnHand: 5 },
    "4": { name: "Mainboard ASRock B550M", unit: "cái", unitPrice: 2890000, minStockThreshold: 6, quantityOnHand: 11 },
  },
  Ram: {
    "1": { name: "RAM Kingston Fury 16GB", unit: "thanh", unitPrice: 1450000, minStockThreshold: 8, quantityOnHand: 20 },
    "2": { name: "RAM Corsair Vengeance 32GB", unit: "thanh", unitPrice: 2890000, minStockThreshold: 6, quantityOnHand: 14 },
    "3": { name: "RAM G.Skill Trident Z5 32GB", unit: "thanh", unitPrice: 3290000, minStockThreshold: 5, quantityOnHand: 9 },
    "4": { name: "RAM Kingston Fury 8GB", unit: "thanh", unitPrice: 890000, minStockThreshold: 10, quantityOnHand: 18 },
  },
  GPU: {
    "1": { name: "GPU RTX 4060", unit: "cái", unitPrice: 7990000, minStockThreshold: 4, quantityOnHand: 7 },
    "2": { name: "GPU RTX 4070 Super", unit: "cái", unitPrice: 18490000, minStockThreshold: 3, quantityOnHand: 4 },
    "3": { name: "GPU RX 7600", unit: "cái", unitPrice: 6990000, minStockThreshold: 4, quantityOnHand: 6 },
    "4": { name: "GPU RTX 3060", unit: "cái", unitPrice: 6490000, minStockThreshold: 5, quantityOnHand: 8 },
  },
  PSU: {
    "1": { name: "PSU Corsair RM750x", unit: "cái", unitPrice: 2890000, minStockThreshold: 5, quantityOnHand: 10 },
    "2": { name: "PSU Cooler Master MWE 650", unit: "cái", unitPrice: 1690000, minStockThreshold: 6, quantityOnHand: 13 },
    "3": { name: "PSU MSI MAG A750GL", unit: "cái", unitPrice: 2290000, minStockThreshold: 5, quantityOnHand: 8 },
    "4": { name: "PSU Thermaltake Toughpower 850", unit: "cái", unitPrice: 3190000, minStockThreshold: 4, quantityOnHand: 6 },
  },
  SSD: {
    "1": { name: "SSD WD Black SN770 1TB", unit: "cái", unitPrice: 2190000, minStockThreshold: 8, quantityOnHand: 15 },
    "2": { name: "SSD Samsung 980 500GB", unit: "cái", unitPrice: 1290000, minStockThreshold: 8, quantityOnHand: 16 },
    "3": { name: "SSD Kingston NV2 1TB", unit: "cái", unitPrice: 1590000, minStockThreshold: 8, quantityOnHand: 12 },
    "4": { name: "SSD Crucial P3 2TB", unit: "cái", unitPrice: 2890000, minStockThreshold: 5, quantityOnHand: 7 },
  },
  HDD: {
    "1": { name: "HDD Seagate Barracuda 1TB", unit: "cái", unitPrice: 1190000, minStockThreshold: 6, quantityOnHand: 14 },
    "2": { name: "HDD WD Blue 2TB", unit: "cái", unitPrice: 1590000, minStockThreshold: 6, quantityOnHand: 11 },
    "3": { name: "HDD Toshiba P300 1TB", unit: "cái", unitPrice: 1090000, minStockThreshold: 6, quantityOnHand: 9 },
    "4": { name: "HDD Seagate IronWolf 4TB", unit: "cái", unitPrice: 2890000, minStockThreshold: 4, quantityOnHand: 5 },
  },
  Case: {
    "1": { name: "Case NZXT H5 Flow", unit: "cái", unitPrice: 2190000, minStockThreshold: 5, quantityOnHand: 8 },
    "2": { name: "Case Lian Li Lancool 216", unit: "cái", unitPrice: 2490000, minStockThreshold: 5, quantityOnHand: 6 },
    "3": { name: "Case Corsair 4000D", unit: "cái", unitPrice: 2390000, minStockThreshold: 5, quantityOnHand: 7 },
    "4": { name: "Case Cooler Master TD500", unit: "cái", unitPrice: 1990000, minStockThreshold: 5, quantityOnHand: 9 },
  },
  Fan: {
    "1": { name: "Fan Arctic P12 PWM", unit: "cái", unitPrice: 290000, minStockThreshold: 12, quantityOnHand: 30 },
    "2": { name: "Fan Noctua NF-A12x25", unit: "cái", unitPrice: 890000, minStockThreshold: 8, quantityOnHand: 14 },
    "3": { name: "Fan Corsair RX120", unit: "cái", unitPrice: 490000, minStockThreshold: 10, quantityOnHand: 18 },
    "4": { name: "Fan Deepcool FK120", unit: "cái", unitPrice: 190000, minStockThreshold: 12, quantityOnHand: 22 },
  },
};

const parseObjectKey = (key: string) => {
  const parts = key.split("/").filter(Boolean);
  if (parts.length < 3) {
    return null;
  }

  const folder = parts[1];
  const fileName = parts[parts.length - 1];
  const stem = fileName.replace(/\.[^.]+$/, "");

  return { folder, fileName, stem };
};

export const syncComponentImagesFromR2 = async (client: PrismaClient) => {
  const keys = await listComponentObjects();
  if (keys.length === 0) {
    throw new Error("Không tìm thấy file ảnh trong bucket R2");
  }

  const categoryIds = new Map<string, number>();
  for (const folder of Object.keys(FOLDER_TO_CATEGORY)) {
    const item = FOLDER_TO_CATEGORY[folder];
    const row = await client.componentCategory.upsert({
      where: { name: item.name },
      update: { description: item.description },
      create: item,
    });
    categoryIds.set(folder, row.id);
  }

  let updated = 0;
  let created = 0;

  for (const key of keys) {
    const parsed = parseObjectKey(key);
    if (!parsed) {
      continue;
    }

    const categoryId = categoryIds.get(parsed.folder);
    if (!categoryId) {
      console.warn(`Bỏ qua thư mục R2 chưa map: ${parsed.folder}`);
      continue;
    }

    const catalogItem = CATALOG[parsed.folder]?.[parsed.stem] ?? {
      name: `${parsed.folder} ${parsed.stem}`,
      unit: "cái",
      unitPrice: 1000000,
      minStockThreshold: 5,
      quantityOnHand: 5,
    };

    const imageUrl = r2PublicUrl(key);
    const existing = await client.component.findFirst({
      where: { name: catalogItem.name },
    });

    if (existing) {
      await client.component.update({
        where: { id: existing.id },
        data: {
          categoryId,
          unit: catalogItem.unit,
          unitPrice: catalogItem.unitPrice,
          minStockThreshold: catalogItem.minStockThreshold,
          imageUrl,
        },
      });
      updated += 1;
      continue;
    }

    await client.component.create({
      data: {
        categoryId,
        name: catalogItem.name,
        unit: catalogItem.unit,
        unitPrice: catalogItem.unitPrice,
        minStockThreshold: catalogItem.minStockThreshold,
        imageUrl,
        inventory: {
          create: { quantityOnHand: catalogItem.quantityOnHand },
        },
      },
    });
    created += 1;
  }

  return { files: keys.length, created, updated };
};

const isDirectRun = process.argv[1]?.includes("sync-r2-images");

if (isDirectRun) {
  const prisma = new PrismaClient();

  syncComponentImagesFromR2(prisma)
    .then((result) => {
      console.log(
        `Đã gắn ảnh R2 vào DB — ${result.files} file, tạo mới ${result.created}, cập nhật ${result.updated}`,
      );
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
