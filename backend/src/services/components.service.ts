// src/services/component.service.ts
import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma"; // Import type nếu cần định nghĩa kiểu dữ liệu chính xác

/**
 * Lấy danh sách tất cả linh kiện
 * Có kèm theo thông tin Danh mục và Số lượng tồn kho
 */
const listWhere = (keyword = "") => ({
  deleted: false as const,
  ...(keyword
    ? { name: { contains: keyword, mode: "insensitive" as const } }
    : {}),
});

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
) => {
  return prisma.component.findMany({
    where: listWhere(keyword),
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

export const countAllComponents = async (keyword = "") => {
  return prisma.component.count({ where: listWhere(keyword) });
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
  return await prisma.component.create({
    data: data,
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
