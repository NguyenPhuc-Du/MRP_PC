# MRP PC Workshop

Hệ thống quản lý kho linh kiện và điều phối lắp ráp máy tính (PC).

- **Web**: Admin (hệ thống) và Quản lý kho (vận hành)
- **Android**: Nhân viên lắp ráp (`staff`)
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis
- **Triển khai**: Docker Compose (+ Nginx)

Chi tiết kiến trúc: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Vai trò

| Vai trò | Kênh | Việc chính |
|---------|------|------------|
| `admin` | Web `/admin` | Tài khoản, phân quyền, sao lưu DB |
| `warehouse_manager` | Web `/warehouse` | Dashboard, linh kiện, phiếu nhập/xuất, BOM, lệnh sản xuất |
| `staff` | App Android | Lệnh được giao → kiểm tra BOM → xin xuất NVL → xác nhận lắp → xin xuất thành phẩm |

## Chạy nhanh (Docker)

Yêu cầu: Docker Desktop, (tuỳ chọn) Android Studio.

```powershell
copy .env.example .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

Kiểm tra:

- Health: http://localhost:3000/health
- Web (qua Nginx): http://localhost/auth/login
- Backend trực tiếp: http://localhost:3000/auth/login

Tài khoản mẫu (mật khẩu `admin123`):

| Username | Vai trò |
|----------|---------|
| `admin` | Quản trị viên |
| `warehouse` | Quản lý kho |
| `staff` | Nhân viên lắp ráp (chỉ app) |

## App Android

1. Mở thư mục `mobile-app` bằng Android Studio (minSdk 24).
2. Sửa `BASE_URL` trong `NetworkModule.kt` (có dấu `/` cuối):
   - Emulator: `http://10.0.2.2:3000/`
   - Máy thật cùng Wi‑Fi: `http://<IPv4-máy-tính>:3000/`
   - Mạng khác: dùng ngrok (`scripts/ngrok.ps1` / `ngrok.yml`) rồi gán URL https.
3. Run app, đăng nhập `staff` / `admin123`.

## Sao lưu

Trên web Admin → **Sao lưu dữ liệu**:

- Tạo bản `.sql` (`pg_dump`), tải về, nạp file, khôi phục trên web
- File lưu ở `./backups` (volume Docker `/backups`)
- Khi khôi phục, hệ thống tự tạo snapshot an toàn `safety-before-restore-*.sql`

## Cấu trúc thư mục

```
MRP_PC/
├── backend/          # Express + Pug + Prisma + API /api
├── mobile-app/       # Kotlin + Jetpack Compose
├── nginx/            # Reverse proxy cổng 80
├── backups/          # File pg_dump
├── docs/             # Kiến trúc
├── scripts/          # Tiện ích (ngrok, …)
├── docker-compose.yml
└── README.md
```

## Ghi chú

- Ảnh linh kiện dùng Cloudflare R2 (tuỳ chọn; thiếu R2 vẫn chạy được nghiệp vụ khác).
- Phân quyền web theo mảng `roles.permissions`. App Android chỉ kiểm tra JWT + role `staff`.
- Sau khi pull code mới: `docker compose exec backend npx prisma migrate deploy`
