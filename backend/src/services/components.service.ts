// src/services/component.service.ts
import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma"; // Import type nếu cần định nghĩa kiểu dữ liệu chính xác

/**
 * Lấy danh sách tất cả linh kiện
 * Có kèm theo thông tin Danh mục và Số lượng tồn kho
 */
const listWhere = (keyword = "", status = "all"): Prisma.ComponentWhereInput => {
  const where: Prisma.ComponentWhereInput = {
    deleted: false,
    ...(keyword
      ? { name: { contains: keyword, mode: "insensitive" } }
      : {}),
  };

  if (status === "active" || status === "discontinued") {
    where.status = status;
  } else if (status === "out_of_stock") {
    // Khớp badge "Hết hàng": đang KD và không có tồn > 0
    where.status = "active";
    where.NOT = {
      inventory: { is: { quantityOnHand: { gt: 0 } } },
    };
  }

  return where;
};

const listInclude = {
  category: {
    select: {
      name: true,
    },
  },
  inventory: {
    select: {
      quantityOnHand: true,
    },
  },
} as const;

export const getAllComponents = async (
  skip: number,
  take: number,
  keyword = "",
  status="all",
) => {
  return prisma.component.findMany({
    where: listWhere(keyword,status),
    skip,
    take,
    include: listInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getAllComponentsSearch = async (
  skip: number,
  take: number,
  keyword: string,
) => {
  return getAllComponents(skip, take, keyword);
};

export const countAllComponents = async (keyword = "", status = "all") => {
  return prisma.component.count({ where: listWhere(keyword, status) });
};

export const countAllComponentsSearch = async (keyword: string) => {
  return countAllComponents(keyword);
};
/**
 * Lấy thông tin chi tiết 1 linh kiện theo ID
 * Kèm theo các thuộc tính (Attributes) của linh kiện đó
 */
export const getComponentById = async (id: number) => {
  return await prisma.component.findUnique({
    where: {
      id: id,
    },
    include: {
      category: true,
      brand: true,
      supplier: true,
      inventory: true,
      attributes: {
        include: {
          attributeDefinition: true,
        },
      },
    },
  });
};

export const getComponentEditLookups = async () => {
  const [categories, brands, suppliers] = await Promise.all([
    prisma.componentCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories, brands, suppliers };
};

/**
 * Tạo mới một linh kiện
 */
export const createComponent = async (
  data: Prisma.ComponentUncheckedCreateInput,
) => {
  return prisma.$transaction(async (tx) => {
    const created = await tx.component.create({ data });
    await tx.inventory.create({
      data: {
        componentId: created.id,
        quantityOnHand: 0,
      },
    });
    return created;
  });
};

/**
 * Cập nhật thông tin linh kiện
 */
export const updateComponent = async (
  id: number,
  data: Prisma.ComponentUncheckedUpdateInput,
) => {
  return await prisma.component.update({
    where: {
      id: id,
    },
    data: data,
  });
};

/**
 * Cập nhật trạng thái linh kiện (Ví dụ: Ngừng kinh doanh)
 */
export const changeComponentStatus = async (
  id: number,
  status: "active" | "discontinued",
) => {
  return await prisma.component.update({
    where: {
      id: id,
    },
    data: {
      status: status,
    },
  });
};
export const deleteComponent= async (id:number) =>{
  return await prisma.component.update({
    where:{id:id},
    data:{deleted:true,deletedAt: new Date()}
  });
}
