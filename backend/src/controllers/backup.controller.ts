import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import * as backupService from "../services/backup.service";

const BASE = () => `${systemConfig.prefixAdmin}/backup`;

const errorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "Tạo bản sao lưu thất bại";
  }

  switch (error.message) {
    case "DATABASE_URL_MISSING":
      return "Chưa cấu hình DATABASE_URL";
    case "PG_DUMP_MISSING":
      return "Chưa có pg_dump. Chạy docker compose up -d --build rồi thử lại";
    case "EMPTY_BACKUP":
      return "File sao lưu rỗng, không lưu";
    case "PG_DUMP_FAILED":
      return "pg_dump thất bại. Kiểm tra Postgres còn chạy";
    default:
      return error.message.includes("pg_dump")
        ? error.message
        : "Tạo bản sao lưu thất bại";
  }
};

export const index = async (_req: Request, res: Response): Promise<void> => {
  const files = await backupService.listBackups();

  res.render("pages/backup/index", {
    pageTitle: "Sao lưu dữ liệu",
    files,
  });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = Number(res.locals.user?.id);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      req.flash("error", "Phiên đăng nhập không hợp lệ");
      res.redirect(BASE());
      return;
    }

    const file = await backupService.createBackup(accountId);
    req.flash("success", `Đã tạo bản sao lưu ${file.filename} (${file.sizeLabel})`);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
  }

  res.redirect(BASE());
};

export const download = async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = backupService.resolveBackupFile(String(req.params.filename || ""));
    res.download(filePath);
  } catch {
    req.flash("error", "Không tìm thấy file sao lưu");
    res.redirect(BASE());
  }
};
