// src/services/component.service.ts
import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma"; // Import type nếu cần định nghĩa kiểu dữ liệu chính xác

/**
 * Lấy danh sách tất cả linh kiện
 * Có kèm theo thông tin Danh mục và Số lượng tồn kho
 */
export const getAllComponents = async (skip: number, take: number) => {
  return await prisma.component.findMany({
    where:{deleted:false},
    skip: skip,
    take: take,
    include: {
      category: {
        select: {
          name: true, // Chỉ lấy tên danh mục cho nhẹ
        },
      },
      inventory: {
        select: {
          quantityOnHand: true, // Lấy số lượng tồn kho hiện tại
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Sắp xếp mới nhất lên đầu
    },
  });
};
export const countAllComponents = async () => {
  return await prisma.component.count({where:{deleted:false}});
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
      inventory: true,
      attributes: {
        include: {
          attributeDefinition: true, // Lấy tên và kiểu dữ liệu của thuộc tính
        },
      },
    },
  });
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
