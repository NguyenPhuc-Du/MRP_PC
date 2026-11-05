#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new()

$docPath = 'C:\Project\MRP_PC\docs\BaoCao_Nhom7_CoThuy.docx'
$outPath = 'C:\Users\admin\Downloads\BaoCao_Nhom7_CoThuy.docx'
$shotDir = 'C:\Project\MRP_PC\docs\app-screenshots'

# Ordered screenshots with captions (verified)
$shots = @(
  @{ File = 'image-454ad284-3213-489e-a923-049a9c425f3c.png'; Title = 'Hình A.1. Màn hình Đăng nhập (MRP PC Workshop)'; Desc = 'Nhân viên lắp ráp nhập tài khoản staff và mật khẩu, chọn Đăng nhập xưởng để nhận JWT và vào danh sách lệnh được giao.' },
  @{ File = 'image-e291c850-e820-4ae3-90d7-7c47a4ef9c70.png'; Title = 'Hình A.2. Danh sách lệnh sản xuất – bộ lọc Tất cả'; Desc = 'Hiển thị toàn bộ lệnh được giao. Thẻ lệnh gồm tên cấu hình, trạng thái, số lượng, mã lệnh và thời điểm tạo. Có nút làm mới và Đăng xuất.' },
  @{ File = 'image-781e4877-2126-40cb-8137-99f64de1ff8b.png'; Title = 'Hình A.3. Bộ lọc Chờ làm'; Desc = 'Chỉ liệt kê lệnh đang ở trạng thái chờ thực hiện, giúp kỹ thuật viên ưu tiên công việc mới được giao.' },
  @{ File = 'image-5621f33c-2422-4857-90d7-54173d71e596.png'; Title = 'Hình A.4. Bộ lọc Đang lắp (trống)'; Desc = 'Khi chưa có lệnh đang lắp ráp, ứng dụng hiển thị trạng thái trống và nút Xem tất cả để quay lại danh sách đầy đủ.' },
  @{ File = 'image-7c17627e-bd33-4cb5-a91e-1cc6316e3ab9.png'; Title = 'Hình A.5. Bộ lọc Hoàn thành (trống)'; Desc = 'Bộ lọc lệnh đã hoàn thành. Trong phiên demo chưa có lệnh hoàn tất nên hiển thị empty state tương tự.' },
  @{ File = 'image-b754c34a-1457-4eca-8d57-e7aeacd99896.png'; Title = 'Hình A.6. Chi tiết lệnh sản xuất'; Desc = 'Màn hình chi tiết gồm thông tin lệnh, trạng thái, số lượng và quy trình chuẩn 3 bước. Hai thao tác chính: Bắt đầu lắp ráp và Kiểm tra tồn kho linh kiện.' },
  @{ File = 'image-dfcdfcdd-1842-4f73-86ec-802a2a5793ec.png'; Title = 'Hình A.7. Kiểm tra tồn kho linh kiện (đối chiếu BOM)'; Desc = 'Đối chiếu từng linh kiện trong BOM với tồn kho thực tế. Hệ thống báo đủ/thiếu theo từng dòng (cần, tồn, định mức) và cho phép tiếp tục sang bước lắp ráp khi đủ vật tư.' },
  @{ File = 'image-7d156645-c629-45ef-a477-8ca62e732551.png'; Title = 'Hình A.8. Quy trình lắp ráp PC – bước đề nghị xuất NVL'; Desc = 'Sau khi kho đủ linh kiện, nhân viên gửi đề nghị xuất nguyên vật liệu theo BOM. Phiếu xuất NVL được tạo ở trạng thái chờ thủ kho duyệt.' },
  @{ File = 'image-c8fbd53a-adc6-4f06-803f-e078b586c53d.png'; Title = 'Hình A.9. Quy trình lắp ráp – đã gửi đề nghị xuất NVL'; Desc = 'Trạng thái lệnh chuyển sang Đang lắp ráp. Phiếu PXM hiển thị mã phiếu và trạng thái Chờ duyệt. Nhân viên có thể xác nhận đã lắp ráp sau khi kho duyệt.' },
  @{ File = 'image-9aedc74e-2ff4-434d-b172-9c47a6b0acb4.png'; Title = 'Hình A.10. Xác nhận hoàn thành lắp ráp'; Desc = 'Khi lắp xong, nhân viên xác nhận hoàn thành. Hệ thống đánh dấu lệnh Hoàn thành, trừ tồn linh kiện thực tế và cộng tồn thành phẩm theo nghiệp vụ backend.' },
  @{ File = 'image-09c25e57-eb7c-4f36-8649-103f410b5269.png'; Title = 'Hình A.11. Đề nghị xuất thành phẩm'; Desc = 'Bước cuối: lập phiếu xuất PC thành phẩm (PXP) để bàn giao kiểm định/giao hàng. Phiếu chờ thủ kho duyệt trên web.' }
)

function Set-Heading($range, $level) {
  switch ($level) {
    1 { $range.Style = 'Heading 1' }
    2 { $range.Style = 'Heading 2' }
    3 { $range.Style = 'Heading 3' }
    default { $range.Style = 'Normal' }
  }
}

function Add-Para($selection, $text, $style = 'Normal', [bool]$bold = $false) {
  $selection.TypeText($text)
  $selection.TypeParagraph()
  $para = $selection.Paragraphs.Item(-1) # previous? Actually after TypeParagraph, current is new empty
  # Style the paragraph just written: move back one para
  $p = $selection.Paragraphs.Last
  # Better: format before TypeParagraph using selection
}

# --- Word COM ---
Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Open($docPath)

# Helper: find text, return Range of match or $null
function Find-Range($doc, $text) {
  $rng = $doc.Content.Duplicate
  $f = $rng.Find
  $f.ClearFormatting() | Out-Null
  $f.Text = $text
  $f.Forward = $true
  $f.Wrap = 0 # wdFindStop
  $f.MatchCase = $false
  $f.MatchWholeWord = $false
  if ($f.Execute()) { return $rng } else { return $null }
}

Write-Host 'Updating table of contents (remove Sound4You manual TOC)...'

# Replace manual Mục lục block: from "Mục Lục" after cover to before "Lời mở đầu"
$tocStart = Find-Range $doc 'Mục Lục'
$loiMoDau = Find-Range $doc 'Lời mở đầu'
if ($null -eq $loiMoDau) { $loiMoDau = Find-Range $doc 'Lời mở đầu' }
if ($null -eq $loiMoDau) { $loiMoDau = Find-Range $doc 'CHƯƠNG I' }

if ($tocStart -and $loiMoDau) {
  # Only replace if Sound4You still in early TOC area
  $probeEnd = [Math]::Min($loiMoDau.Start, $tocStart.Start + 8000)
  $probe = $doc.Range($tocStart.Start, $probeEnd).Text
  if ($probe -match 'Sound4You|Now Playing|Feed Following|Stream View|upload track') {
    $del = $doc.Range($tocStart.Start, $loiMoDau.Start)
    $del.Text = ''
    $ins = $doc.Range($tocStart.Start, $tocStart.Start)
    $ins.Text = "MỤC LỤC`r"
    $ins.Style = -2 # wdStyleHeading1
    $ins.Collapse(0) # end
    # Insert TOC field
    $tocRange = $doc.Range($ins.Start, $ins.Start)
    $null = $doc.TablesOfContents.Add($tocRange, $true, 1, 3)
    $tocRange.InsertParagraphAfter() | Out-Null
    Write-Host 'TOC field inserted.'
  } else {
    Write-Host 'Manual Sound4You TOC not detected in expected range; will still refresh TOC fields later.'
  }
} else {
  Write-Host 'Could not locate Mục Lục / Lời mở đầu for TOC replace.'
}

Write-Host 'Inserting Android UI section and rewriting install guide...'

$anchor = Find-Range $doc 'Hướng dẫn sử dụng và cái đặt'
if ($null -eq $anchor) { $anchor = Find-Range $doc 'Hướng dẫn sử dụng và cài đặt' }
if ($null -eq $anchor) { throw 'Cannot find installation section anchor' }

# Delete from anchor to end (keep section break if any - Content.End-1)
$endPos = $doc.Content.End - 1
$oldSection = $doc.Range($anchor.Start, $endPos)
$oldSection.Delete() | Out-Null

# Insert at end
$sel = $word.Selection
$sel.EndKey(6) | Out-Null # wdStory = 6

# Word built-in style IDs (locale-independent)
$script:WdNormal = -1
$script:WdHeading1 = -2
$script:WdHeading2 = -3
$script:WdHeading3 = -4

function Get-StyleId($preferred) {
  switch ($preferred) {
    'Heading 1' { return $script:WdHeading1 }
    'Heading 2' { return $script:WdHeading2 }
    'Heading 3' { return $script:WdHeading3 }
    default { return $script:WdNormal }
  }
}

function Write-StyledParagraph($sel, $text, $styleName) {
  $sel.Style = (Get-StyleId $styleName)
  $sel.Font.Name = 'Times New Roman'
  $sel.Font.Size = 13
  $sel.TypeText($text)
  $sel.TypeParagraph()
  $sel.Style = $script:WdNormal
  $sel.Font.Name = 'Times New Roman'
  $sel.Font.Size = 13
  $sel.Font.Bold = $false
}

function Write-Body($sel, $text) {
  $sel.Style = $script:WdNormal
  $sel.Font.Name = 'Times New Roman'
  $sel.Font.Size = 13
  $sel.ParagraphFormat.Alignment = 3 # wdAlignParagraphJustify
  $sel.ParagraphFormat.FirstLineIndent = 18
  $sel.ParagraphFormat.SpaceAfter = 6
  $sel.TypeText($text)
  $sel.TypeParagraph()
  $sel.ParagraphFormat.FirstLineIndent = 0
}

function Write-Caption($sel, $text) {
  $sel.Style = $script:WdNormal
  $sel.Font.Name = 'Times New Roman'
  $sel.Font.Size = 12
  $sel.Font.Italic = $true
  $sel.ParagraphFormat.Alignment = 1 # center
  $sel.ParagraphFormat.FirstLineIndent = 0
  $sel.ParagraphFormat.SpaceAfter = 10
  $sel.TypeText($text)
  $sel.TypeParagraph()
  $sel.Font.Italic = $false
  $sel.ParagraphFormat.Alignment = 0
}

function Insert-Shot($sel, $path, $widthCm = 6.2) {
  if (-not (Test-Path $path)) { throw "Missing image: $path" }
  $shape = $sel.InlineShapes.AddPicture($path, $false, $true)
  # 1 cm ≈ 28.35 points
  $shape.Width = [int]($widthCm * 28.35)
  $sel.TypeParagraph()
}

# ===== SECTION: Giao dien app =====
Write-StyledParagraph $sel '8. Mô tả giao diện ứng dụng Android (MRP PC Workshop)' 'Heading 1'
Write-Body $sel 'Ứng dụng Android dành cho nhân viên lắp ráp (vai trò staff), được xây dựng bằng Kotlin và Jetpack Compose. Giao diện theo chủ đề tối (dark theme), tập trung vào luồng nhận lệnh – kiểm tra tồn theo BOM – đề nghị xuất NVL – xác nhận lắp ráp – đề nghị xuất thành phẩm. Nhân viên chỉ nhìn thấy các lệnh sản xuất được giao cho đúng tài khoản đang đăng nhập.'

Write-StyledParagraph $sel '8.1. Đăng nhập' 'Heading 2'
Write-Body $sel 'Màn hình đăng nhập hiển thị thương hiệu MRP PC Workshop, trường Tài khoản và Mật khẩu. Sau khi xác thực thành công qua API POST /api/auth/login, ứng dụng lưu access token (JWT) và chuyển sang danh sách lệnh sản xuất. Chỉ tài khoản role staff đang active mới đăng nhập được trên app.'
Insert-Shot $sel (Join-Path $shotDir $shots[0].File)
Write-Caption $sel $shots[0].Title
Write-Body $sel $shots[0].Desc

Write-StyledParagraph $sel '8.2. Danh sách lệnh sản xuất và bộ lọc trạng thái' 'Heading 2'
Write-Body $sel 'Màn hình chính liệt kê lệnh được giao. Thanh bộ lọc gồm: Tất cả, Chờ làm, Đang lắp, Hoàn thành. Mỗi thẻ lệnh thể hiện tên cấu hình PC, mô tả ngắn, badge trạng thái, số lượng máy, mã lệnh và thời điểm tạo. Người dùng bấm Vào chi tiết để xem quy trình thực hiện.'
Insert-Shot $sel (Join-Path $shotDir $shots[1].File)
Write-Caption $sel $shots[1].Title
Write-Body $sel $shots[1].Desc
Insert-Shot $sel (Join-Path $shotDir $shots[2].File)
Write-Caption $sel $shots[2].Title
Write-Body $sel $shots[2].Desc
Insert-Shot $sel (Join-Path $shotDir $shots[3].File)
Write-Caption $sel $shots[3].Title
Write-Body $sel $shots[3].Desc
Insert-Shot $sel (Join-Path $shotDir $shots[4].File)
Write-Caption $sel $shots[4].Title
Write-Body $sel $shots[4].Desc

Write-StyledParagraph $sel '8.3. Chi tiết lệnh sản xuất' 'Heading 2'
Write-Body $sel 'Màn hình chi tiết tóm tắt thông tin lệnh và mô tả quy trình chuẩn 3 bước. Nút Bắt đầu lắp ráp đưa nhân viên vào luồng thực hiện; nút Kiểm tra tồn kho linh kiện mở màn hình đối chiếu BOM với tồn kho hiện tại.'
Insert-Shot $sel (Join-Path $shotDir $shots[5].File)
Write-Caption $sel $shots[5].Title
Write-Body $sel $shots[5].Desc

Write-StyledParagraph $sel '8.4. Kiểm tra tồn kho linh kiện theo BOM' 'Heading 2'
Write-Body $sel 'Ứng dụng lấy định mức BOM của cấu hình máy gắn với lệnh, so sánh số lượng cần với tồn kho. Từng dòng linh kiện có trạng thái Đủ linh kiện hoặc thiếu, kèm số liệu Cần / Tồn kho / BOM. Khi đủ vật tư, hệ thống cho phép tiếp tục sang bước lắp ráp.'
Insert-Shot $sel (Join-Path $shotDir $shots[6].File)
Write-Caption $sel $shots[6].Title
Write-Body $sel $shots[6].Desc

Write-StyledParagraph $sel '8.5. Quy trình lắp ráp PC (3 bước)' 'Heading 2'
Write-Body $sel 'Màn hình quy trình hướng dẫn kỹ thuật viên hoàn tất lệnh theo đúng thứ tự nghiệp vụ kho – sản xuất:'
Write-Body $sel 'Bước 1 – Đề nghị xuất kho linh kiện (NVL): lập phiếu xuất theo BOM, gửi thủ kho duyệt trên web. Phiếu ở trạng thái chờ duyệt thì chưa trừ tồn.'
Write-Body $sel 'Bước 2 – Xác nhận hoàn thành lắp ráp: sau khi kho duyệt và đã lắp xong, nhân viên xác nhận. Hệ thống cập nhật trạng thái lệnh và xử lý tồn theo nghiệp vụ server.'
Write-Body $sel 'Bước 3 – Đề nghị xuất thành phẩm: lập phiếu xuất PC thành phẩm để bàn giao kiểm định/giao hàng, chờ thủ kho duyệt.'
Insert-Shot $sel (Join-Path $shotDir $shots[7].File)
Write-Caption $sel $shots[7].Title
Write-Body $sel $shots[7].Desc
Insert-Shot $sel (Join-Path $shotDir $shots[8].File)
Write-Caption $sel $shots[8].Title
Write-Body $sel $shots[8].Desc
Insert-Shot $sel (Join-Path $shotDir $shots[9].File)
Write-Caption $sel $shots[9].Title
Write-Body $sel $shots[9].Desc
Insert-Shot $sel (Join-Path $shotDir $shots[10].File)
Write-Caption $sel $shots[10].Title
Write-Body $sel $shots[10].Desc

Write-StyledParagraph $sel '8.6. Tóm tắt luồng thao tác trên app' 'Heading 2'
Write-Body $sel 'Đăng nhập (staff) → xem lệnh được giao → mở chi tiết → kiểm tra tồn theo BOM → gửi đề nghị xuất NVL → chờ kho duyệt trên web → xác nhận đã lắp ráp → gửi đề nghị xuất thành phẩm → kho duyệt phiếu thành phẩm. Toàn bộ thao tác chỉ áp dụng cho lệnh được gán đúng tài khoản đang đăng nhập.'

# ===== SECTION: Huong dan cai dat =====
Write-StyledParagraph $sel 'PHỤ LỤC. Hướng dẫn cài đặt và sử dụng hệ thống MRP PC' 'Heading 1'
Write-Body $sel 'Phụ lục này mô tả cách dựng môi trường, cấu hình, chạy hệ thống bằng Docker và chạy ứng dụng Android cho nhân viên lắp ráp. Các lệnh minh họa dành cho Windows (PowerShell).'

Write-StyledParagraph $sel 'A. Yêu cầu phần mềm' 'Heading 2'
Write-Body $sel '1. Git – quản lý mã nguồn.'
Write-Body $sel '2. Node.js LTS (đi kèm npm) – hỗ trợ chạy/cài phụ thuộc khi cần thao tác ngoài Docker.'
Write-Body $sel '3. Docker Desktop (có Docker Compose) – chạy PostgreSQL 16, Redis 7, backend Node/Express và Nginx theo file docker-compose.yml. Không cần cài MySQL.'
Write-Body $sel '4. Android Studio – mở thư mục mobile-app, build và chạy app (minSdk 24 / Android 7.0 trở lên).'
Write-Body $sel '5. ngrok (tùy chọn) – khi điện thoại không cùng mạng LAN với máy chạy backend, dùng để tạo URL HTTPS public tới cổng 3000.'

Write-StyledParagraph $sel 'B. Cấu hình môi trường' 'Heading 2'
Write-Body $sel 'Tại thư mục gốc dự án (MRP_PC), tạo file môi trường từ mẫu:'
Write-Body $sel 'copy .env.example .env'
Write-Body $sel 'Giá trị mẫu dùng được ngay khi chạy Docker: POSTGRES_USER=mrp, POSTGRES_PASSWORD=mrp123, POSTGRES_DB=mrp_pc, DATABASE_URL=postgresql://mrp:mrp123@postgres:5432/mrp_pc, REDIS_URL=redis://redis:6379, PORT=3000. Giữ SESSION_SECRET và JWT_SECRET như file mẫu khi demo local. Host postgres và redis là tên service trong Docker Compose – không đổi thành localhost khi chạy bằng docker compose.'
Write-Body $sel 'Ảnh linh kiện (nếu dùng) lưu trên Cloudflare R2: điền R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL. Chưa cấu hình R2 vẫn đăng nhập và thao tác nghiệp vụ được.'

Write-StyledParagraph $sel 'C. Cấu hình địa chỉ API cho ứng dụng Android' 'Heading 2'
Write-Body $sel 'Mở file mobile-app/app/src/main/java/com/example/mrp_pc/di/NetworkModule.kt và sửa hằng BASE_URL (bắt buộc có dấu / ở cuối):'
Write-Body $sel '• Máy ảo Android Emulator: http://10.0.2.2:3000/'
Write-Body $sel '• Điện thoại thật cùng Wi-Fi với máy chủ: http://<IPv4-máy-tính>:3000/ (xem IPv4 bằng lệnh ipconfig trên Windows).'
Write-Body $sel '• Khác mạng / cần HTTPS công khai: chạy ngrok http 3000, lấy URL dạng https://xxxx.ngrok-free.dev/ và gán vào BASE_URL. Nên thêm header ngrok-skip-browser-warning trên client nếu dùng gói ngrok miễn phí.'
Write-Body $sel 'Sau khi đổi BASE_URL, build lại app (Android Studio → Rebuild Project hoặc lệnh gradlew assembleDebug).'

Write-StyledParagraph $sel 'D. Khởi chạy backend bằng Docker' 'Heading 2'
Write-Body $sel 'Mở Docker Desktop (Engine Running). Trong PowerShell tại thư mục gốc dự án:'
Write-Body $sel 'docker compose up -d --build'
Write-Body $sel 'docker compose exec backend npx prisma migrate deploy'
Write-Body $sel 'docker compose exec backend npm run prisma:seed'
Write-Body $sel 'Lệnh đầu dựng PostgreSQL (5432), Redis (6379), backend (3000) và Nginx (80). Lệnh hai áp dụng migration tạo bảng. Lệnh ba nạp dữ liệu mẫu. Kiểm tra health: http://localhost:3000/health – kết quả mong đợi {"ok":true,"service":"mrp-pc-backend"}.'
Write-Body $sel 'Nếu lần build bị lỗi mạng khi npm install trong Dockerfile (ECONNRESET), đợi mạng ổn định rồi chạy lại docker compose up -d --build.'

Write-StyledParagraph $sel 'E. Truy cập web quản trị / kho' 'Heading 2'
Write-Body $sel 'Đăng nhập web tại http://localhost/admin/auth/login hoặc http://localhost:3000/admin/auth/login. Toàn bộ trang quản trị nằm dưới tiền tố /admin (không dùng đường dẫn /warehouse).'
Write-Body $sel 'Tài khoản mẫu (mật khẩu cả ba đều là admin123):'
Write-Body $sel '• admin – Quản trị viên (web): tài khoản, phân quyền, sao lưu…'
Write-Body $sel '• warehouse – Quản lý kho (web): linh kiện, BOM, phiếu nhập/xuất, lệnh sản xuất, dashboard…'
Write-Body $sel '• staff – Nhân viên lắp ráp (chỉ Android): không có quyền thao tác trên web.'

Write-StyledParagraph $sel 'F. Chạy ứng dụng Android' 'Heading 2'
Write-Body $sel '1. Mở thư mục mobile-app bằng Android Studio.'
Write-Body $sel '2. Đồng bộ Gradle, chọn emulator hoặc điện thoại đã bật USB debugging.'
Write-Body $sel '3. Đảm bảo BASE_URL trỏ đúng backend đang chạy.'
Write-Body $sel '4. Bấm Run (hoặc .\gradlew.bat assembleDebug rồi cài APK debug).'
Write-Body $sel '5. Đăng nhập bằng tài khoản staff / admin123.'

Write-StyledParagraph $sel 'G. Expose API bằng ngrok (tùy chọn)' 'Heading 2'
Write-Body $sel 'Cài ngrok (winget install Ngrok.Ngrok), đăng ký tài khoản, chạy: ngrok config add-authtoken <token>. Đảm bảo phiên bản ngrok ≥ 3.28.0 (ngrok update). Khi backend lắng nghe cổng 3000: ngrok http 3000. Sao chép URL HTTPS vào BASE_URL của app rồi rebuild.'

Write-StyledParagraph $sel 'H. Quy trình demo nhanh' 'Heading 2'
Write-Body $sel '1. Đăng nhập web bằng warehouse: khai báo linh kiện (nếu cần), kiểm tra BOM, tạo lệnh sản xuất và giao cho staff.'
Write-Body $sel '2. Đăng nhập Android bằng staff: mở lệnh → kiểm tra tồn theo BOM → gửi đề nghị xuất NVL.'
Write-Body $sel '3. Trên web, warehouse vào Phiếu xuất để duyệt phiếu NVL.'
Write-Body $sel '4. Trên app, staff xác nhận đã lắp ráp xong → gửi đề nghị xuất thành phẩm.'
Write-Body $sel '5. Warehouse duyệt phiếu xuất thành phẩm trên web. Theo dõi tiến độ trên dashboard nếu cần xuất Excel/PDF.'

Write-StyledParagraph $sel 'I. Sự cố thường gặp' 'Heading 2'
Write-Body $sel '• Lệnh docker không nhận trong terminal Cursor: thêm thư mục bin của Docker Desktop vào PATH phiên hiện tại, hoặc đóng hẳn Cursor rồi mở lại; đảm bảo Docker Desktop đang Running.'
Write-Body $sel '• Lỗi P2021 table accounts does not exist: chưa migrate – chạy prisma migrate deploy và prisma:seed như mục D.'
Write-Body $sel '• App không gọi được API: sai BASE_URL, firewall, hoặc backend chưa lên cổng 3000; với ngrok free nhớ header bỏ trang cảnh báo.'
Write-Body $sel '• PowerShell chặn npm.ps1: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned hoặc dùng npm.cmd.'

Write-Host 'Updating TOC fields...'
foreach ($toc in @($doc.TablesOfContents)) {
  try { $toc.Update() } catch {}
}
$doc.Fields.Update()

Write-Host 'Saving...'
$doc.SaveAs([ref]$docPath)
$doc.SaveAs([ref]$outPath)
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
Write-Host "DONE. Saved to:`n  $docPath`n  $outPath"
