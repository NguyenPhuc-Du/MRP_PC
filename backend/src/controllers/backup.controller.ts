import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import * as backupService from "../services/backup.service";

const BASE = () => `${systemConfig.prefixAdmin}/backup`;

const errorMessage = (
  error: unknown,
  action: "create" | "restore" | "upload" = "create",
): string => {
  const fallback =
    action === "restore"
      ? "Khôi phục bản sao lưu thất bại"
      : action === "upload"
        ? "Nạp file sao lưu thất bại"
        : "Tạo bản sao lưu thất bại";

  if (!(error instanceof Error)) {
    return fallback;
  }

  switch (error.message) {
    case "DATABASE_URL_MISSING":
      return "Chưa cấu hình DATABASE_URL";
    case "PG_DUMP_MISSING":
      return "Chưa có pg_dump. Chạy docker compose up -d --build rồi thử lại";
    case "PSQL_MISSING":
      return "Chưa có psql. Image backend cần postgresql-client";
    case "EMPTY_BACKUP":
      return "File sao lưu rỗng, không lưu";
    case "PG_DUMP_FAILED":
      return "pg_dump thất bại. Kiểm tra Postgres còn chạy";
    case "PSQL_FAILED":
      return "Khôi phục thất bại khi chạy psql. Kiểm tra file .sql và Postgres";
    case "INVALID_FILE":
      return "Tên file sao lưu không hợp lệ";
    case "FILE_NOT_FOUND":
      return "Không tìm thấy file sao lưu";
    case "INVALID_UPLOAD":
      return "Chỉ chấp nhận file .sql";
    case "NO_UPLOAD":
      return "Chưa chọn file sao lưu";
    default:
      if (error.message.includes("pg_dump") || error.message.includes("psql")) {
        return error.message;
      }
      return fallback;
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
    req.flash("error", errorMessage(error, "create"));
  }

  res.redirect(BASE());
};

export const uploadPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = Number(res.locals.user?.id);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      req.flash("error", "Phiên đăng nhập không hợp lệ");
      res.redirect(BASE());
      return;
    }

    const uploaded = req.file;
    if (!uploaded?.buffer?.length) {
      throw new Error("NO_UPLOAD");
    }

    const file = await backupService.saveUploadedBackup(
      accountId,
      uploaded.originalname,
      uploaded.buffer,
    );
    req.flash(
      "success",
      `Đã nạp file ${file.filename} (${file.sizeLabel}) vào thư mục backups. Có thể bấm Khôi phục khi cần.`,
    );
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error, "upload"));
  }

  res.redirect(BASE());
};

export const restorePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = Number(res.locals.user?.id);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      req.flash("error", "Phiên đăng nhập không hợp lệ");
      res.redirect(BASE());
      return;
    }

    const filename = String(req.params.filename || "");
    const file = await backupService.restoreBackup(accountId, filename);
    req.flash(
      "success",
      `Đã khôi phục database từ ${file.filename}. Dữ liệu hiện tại đã được thay bằng bản sao lưu này.`,
    );
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error, "restore"));
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
