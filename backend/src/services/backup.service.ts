import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { prisma } from "../config/database";

export type BackupFile = {
  filename: string;
  size: number;
  sizeLabel: string;
  createdAt: Date;
};

const FILE_PATTERN = /^mrp_pc-\d{4}-\d{2}-\d{2}-\d{6}\.sql$/;

const getBackupDir = (): string => {
  return process.env.BACKUP_DIR || path.resolve(process.cwd(), "..", "backups");
};

const parseDatabaseUrl = (raw: string) => {
  const url = new URL(raw);
  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.replace(/^\//, "").replace(/\/$/, ""),
  };
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const timestampName = (): string => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    "mrp_pc",
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
  ].join("-") + ".sql";
};

export const listBackups = async (): Promise<BackupFile[]> => {
  const dir = getBackupDir();
  await fsp.mkdir(dir, { recursive: true });

  const names = await fsp.readdir(dir);
  const files: BackupFile[] = [];

  for (const name of names) {
    if (!FILE_PATTERN.test(name)) {
      continue;
    }

    const stat = await fsp.stat(path.join(dir, name));
    if (!stat.isFile()) {
      continue;
    }

    files.push({
      filename: name,
      size: stat.size,
      sizeLabel: formatSize(stat.size),
      createdAt: stat.mtime,
    });
  }

  files.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  return files;
};

export const createBackup = async (accountId: number): Promise<BackupFile> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_MISSING");
  }

  const db = parseDatabaseUrl(databaseUrl);
  const dir = getBackupDir();
  await fsp.mkdir(dir, { recursive: true });

  const filename = timestampName();
  const filePath = path.join(dir, filename);

  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    const child = spawn(
      "pg_dump",
      [
        "-h",
        db.host,
        "-p",
        db.port,
        "-U",
        db.user,
        "-d",
        db.database,
        "--no-owner",
        "--no-acl",
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: db.password,
        },
      },
    );

    child.stdout.pipe(out);

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      out.destroy();
      const code = (error as NodeJS.ErrnoException).code;
      reject(code === "ENOENT" ? new Error("PG_DUMP_MISSING") : error);
    });

    child.on("close", (code) => {
      out.end(() => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr.trim() || "PG_DUMP_FAILED"));
      });
    });
  });

  const stat = await fsp.stat(filePath);
  if (stat.size < 10) {
    await fsp.unlink(filePath).catch(() => undefined);
    throw new Error("EMPTY_BACKUP");
  }

  await prisma.auditLog.create({
    data: {
      accountId,
      action: "create_backup",
      targetTable: "database",
      detail: filename,
    },
  });

  return {
    filename,
    size: stat.size,
    sizeLabel: formatSize(stat.size),
    createdAt: stat.mtime,
  };
};

export const resolveBackupFile = (filename: string): string => {
  if (!FILE_PATTERN.test(filename)) {
    throw new Error("INVALID_FILE");
  }

  const dir = path.resolve(getBackupDir());
  const filePath = path.resolve(dir, filename);
  const prefix = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`;

  if (!filePath.startsWith(prefix)) {
    throw new Error("INVALID_FILE");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error("FILE_NOT_FOUND");
  }

  return filePath;
};
