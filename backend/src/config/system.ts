const PREFIX_ADMIN = "/admin";
const PREFIX_WAREHOUSE = "/warehouse";

export const systemConfig = {
  prefixAdmin: PREFIX_ADMIN,
  prefixWarehouse: PREFIX_WAREHOUSE,
};

export const prefixForRole = (role?: string | null): string => {
  if (role === "warehouse_manager") {
    return PREFIX_WAREHOUSE;
  }
  return PREFIX_ADMIN;
};