import "express-session";

declare module "express-session" {
  interface SessionData {
    oldInput?: Record<string, string>;

    // dùng lưu session trc cho manager quản lý
    account?: {
      id: number;
      username: string;
      fullName: string | null;
      role: "admin" | "warehouse_manager" | "staff";
    };
  }
}
