#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$docPath = 'C:\Project\MRP_PC\docs\BaoCao_Nhom7_CoThuy.docx'
$outPath = 'C:\Users\admin\Downloads\BaoCao_Nhom7_CoThuy.docx'

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Open($docPath)

# Real Lời mở đầu body (after outdated Sound4You TOC)
$rng = $doc.Content
$f = $rng.Find
$f.Text = 'Trong các cơ sở lắp ráp máy tính theo cấu hình, việc theo dõi linh kiện'
$f.Wrap = 0
if (-not $f.Execute()) { throw 'Lời mở đầu body not found' }
# Include the heading "Lời mở đầu" just before this paragraph
$loiPara = $doc.Range($rng.Start, $rng.Start).Paragraphs.Item(1).Range
$chapterStart = $loiPara.Start
# Walk back one paragraph if previous is "Lời mở đầu"
$prev = $doc.Range([Math]::Max(0, $chapterStart - 50), $chapterStart)
if ($prev.Text -match 'Lời mở đầu') {
  $chapterStart = $prev.Paragraphs.Item(1).Range.Start
}
Write-Host "Body/Lời mở đầu at $chapterStart"

# Find Mục Lục title (first)
$r0 = $doc.Content
$f0 = $r0.Find
$f0.Text = 'Mục Lục'
$f0.Wrap = 0
if (-not $f0.Execute()) { throw 'Mục Lục not found' }
$tocStart = $r0.Start
Write-Host "TOC at $tocStart"

if ($tocStart -ge $chapterStart) { throw 'invalid positions' }

# Replace entire front TOC with new text by assigning .Text
# First unlink/delete fields in range to avoid "cannot edit"
$area = $doc.Range($tocStart, $chapterStart)
Write-Host "Area fields before: $($area.Fields.Count)"
# Delete fields from end to start
for ($i = $area.Fields.Count; $i -ge 1; $i--) {
  try { $area.Fields.Item($i).Delete() } catch {}
}
Write-Host "Area fields after: $($area.Fields.Count)"

$manualToc = @"
MỤC LỤC

Lời mở đầu
CHƯƠNG I: TỔNG QUAN ĐỀ TÀI
1. Lý do chọn đề tài
2. Phương pháp nghiên cứu
3. Áp dụng thực tiễn
CHƯƠNG II: CƠ SỞ LÝ LUẬN
1. Cơ sở lý luận của đề tài
1.1. Tổng quan về hệ thống MRP PC
1.2. Mô tả chi tiết hệ thống
1.3. Xác định yêu cầu
1.4. Bảng mô tả nghiệp vụ
1.5. Mục tiêu của hệ thống MRP PC
1.6. Ý nghĩa và khó khăn của việc nghiên cứu đề tài
CHƯƠNG III: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
1. Mô hình BFD
2. Mô hình Usecase
3. Đặc tả Usecase
4. Mô hình Sequence
5. ERD và RDM
6. Lược đồ cơ sở dữ liệu và bảng mô tả
7. Sơ đồ lớp
8. Mô tả giao diện ứng dụng Android (MRP PC Workshop)
8.1. Đăng nhập
8.2. Danh sách lệnh sản xuất và bộ lọc trạng thái
8.3. Chi tiết lệnh sản xuất
8.4. Kiểm tra tồn kho linh kiện theo BOM
8.5. Quy trình lắp ráp PC (3 bước)
8.6. Tóm tắt luồng thao tác trên app
CHƯƠNG IV: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
1. Kết luận
2. Hạn chế
3. Hướng phát triển
PHỤ LỤC. Hướng dẫn cài đặt và sử dụng hệ thống MRP PC
A. Yêu cầu phần mềm
B. Cấu hình môi trường
C. Cấu hình địa chỉ API cho ứng dụng Android
D. Khởi chạy backend bằng Docker
E. Truy cập web quản trị / kho
F. Chạy ứng dụng Android
G. Expose API bằng ngrok (tùy chọn)
H. Quy trình demo nhanh
I. Sự cố thường gặp

Mục lục hình ảnh (giao diện Android)
Hình A.1. Màn hình Đăng nhập (MRP PC Workshop)
Hình A.2. Danh sách lệnh sản xuất – bộ lọc Tất cả
Hình A.3. Bộ lọc Chờ làm
Hình A.4. Bộ lọc Đang lắp (trống)
Hình A.5. Bộ lọc Hoàn thành (trống)
Hình A.6. Chi tiết lệnh sản xuất
Hình A.7. Kiểm tra tồn kho linh kiện (đối chiếu BOM)
Hình A.8. Quy trình lắp ráp PC – bước đề nghị xuất NVL
Hình A.9. Quy trình lắp ráp – đã gửi đề nghị xuất NVL
Hình A.10. Xác nhận hoàn thành lắp ráp
Hình A.11. Đề nghị xuất thành phẩm

"@

# Re-acquire range after field deletes (positions may shift slightly)
$r0 = $doc.Content
$f0 = $r0.Find
$f0.Text = 'Mục Lục'
$f0.Wrap = 0
$f0.Execute() | Out-Null
$tocStart = $r0.Start

$rng = $doc.Content
$f = $rng.Find
$f.Text = 'Trong các cơ sở lắp ráp máy tính theo cấu hình, việc theo dõi linh kiện'
$f.Wrap = 0
$f.Execute() | Out-Null
$loiBody = $rng.Start
# Prefer cutting at the Lời mở đầu heading paragraph before that sentence
$cut = $loiBody
$back = $doc.Range([Math]::Max(0, $loiBody - 80), $loiBody)
if ($back.Text -match 'Lời mở đầu') {
  $cut = $back.Paragraphs.Item(1).Range.Start
}
Write-Host "Cut end recalculated at $cut"

$area = $doc.Range($tocStart, $cut)
try {
  $area.Text = $manualToc
  Write-Host 'Replaced TOC via Range.Text'
} catch {
  Write-Host "Range.Text failed: $($_.Exception.Message)"
  $ins = $doc.Range($cut, $cut)
  $ins.InsertBefore($manualToc + "`r")
  Write-Host 'Inserted TOC before Lời mở đầu as fallback'
}

try {
  $doc.Range($tocStart, $tocStart + 10).Paragraphs.Item(1).Style = -2
} catch {}

# Ensure page break before Lời mở đầu body
$rng = $doc.Content
$f = $rng.Find
$f.Text = 'Trong các cơ sở lắp ráp máy tính theo cấu hình, việc theo dõi linh kiện'
$f.Wrap = 0
if ($f.Execute()) {
  $back = $doc.Range([Math]::Max(0, $rng.Start - 80), $rng.Start)
  if ($back.Text -match 'Lời mở đầu') {
    $h = $back.Paragraphs.Item(1).Range
    try { $h.Style = -2 } catch {}
    $h.Collapse(1)
    $h.InsertBreak(7) | Out-Null
  }
}

# Global replace leftover Sound4You label in body theory section if any
$replace = $doc.Content.Find
$replace.ClearFormatting() | Out-Null
$replace.Replacement.ClearFormatting() | Out-Null
$replace.Text = 'Sound4You'
$replace.Replacement.Text = 'MRP PC'
$replace.Wrap = 1
$replace.Forward = $true
$null = $replace.Execute([ref]$replace.Text, $false, $false, $false, $false, $false, $true, 1, $false, [ref]$replace.Replacement.Text, 2)

$doc.SaveAs([ref]$docPath)
Copy-Item $docPath $outPath -Force

$t = $doc.Content.Text
Write-Host ("Sound4You left: {0}" -f ($t.Contains('Sound4You')))
Write-Host ("Has new TOC section 8: {0}" -f ($t.Contains('8. Mô tả giao diện ứng dụng Android (MRP PC Workshop)')))
Write-Host ("Has Android UI content: {0}" -f ($t.Contains('Hình A.1')))
Write-Host ("pages: $($doc.ComputeStatistics(2))")

$doc.Close()
$word.Quit()
[GC]::Collect()
Write-Host 'DONE'
