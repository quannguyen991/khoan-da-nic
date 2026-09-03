# DỰNG APK — chạy được từ đầu trên máy Windows sạch.
#
# ══════════ BA CÁI BẪY ĐÃ DẪM PHẢI, ĐỌC TRƯỚC KHI SỬA ══════════
#
# ⚠️ ⓪ TỆP NÀY PHẢI LƯU UTF-8 **CÓ BOM**. ĐỪNG LƯU LẠI BẰNG CÔNG CỤ TỰ BỎ BOM.
#    Windows PowerShell 5.1 đọc `.ps1` không BOM theo bảng mã ANSI (cp1252). Khi
#    đó hằng `$Frontend` ngay dưới đây — có `ợ ý ả đ` — hỏng NGAY LÚC PHÂN TÍCH
#    CÚ PHÁP, thành `D:\trá»£-lÃ½-áº£o-khoan-Ä‘Ã£ (1)`. Lỗi báo ra là
#    "Cannot find path ... because it does not exist", nghe như thư mục bị xoá
#    chứ không như lỗi bảng mã, nên rất dễ đi tìm nhầm chỗ.
#    Truyền `-Frontend` ở dòng lệnh KHÔNG chữa được — dòng lệnh cũng cùng bảng mã.
#
# ⚠️ ① ĐƯỜNG DẪN CÓ DẤU TIẾNG VIỆT LÀM HỎNG GRADLE.
#    Thư mục frontend tên `trợ-lý-ảo-khoan-đã (1)`. Chạy `gradlew` trong đó thì
#    java.exe báo `Could not find or load main class GradleWrapperMain` — TRONG
#    KHI tệp `gradle-wrapper.jar` có thật và chứa đúng lớp đó (đã mở ra kiểm).
#    Nguyên nhân: `ợ ý ả đ` không nằm trong bảng mã dòng lệnh của Windows, nên
#    đường dẫn `-cp` bị méo. Java báo "không tìm thấy LỚP" chứ không báo "không
#    tìm thấy JAR" — nên rất dễ đi sai hướng cả tiếng đồng hồ.
#    ⇒ Dựng ở `D:\khoan-da-build`, thuần ASCII.
#
# ⚠️ ② CHÉP MỖI THƯ MỤC `android/` LÀ KHÔNG ĐỦ.
#    `capacitor.settings.gradle` trỏ `../node_modules/@capacitor/...`. Chép
#    thiếu thì Gradle cấu hình xong mới hỏng, kèm lỗi
#    "No matching configuration of project :capacitor-android" — nghe như lỗi
#    phiên bản AGP chứ không như lỗi thiếu tệp.
#    ⇒ Phải chép cả ba gói @capacitor sang NGAY CẠNH thư mục android.
#
# Chạy:  powershell -File scripts\dung-apk.ps1
#        powershell -File scripts\dung-apk.ps1 -ApiGoc https://may-chu-cua-ban

param(
  # ⚠️ APK KHÔNG TỰ CHẠY ĐƯỢC BỘ LUẬT. Bộ luật ở máy chủ Node; trong APK
  # `/api/analyze` trỏ vào `https://localhost` của WebView — nơi chỉ có tệp tĩnh.
  # Không đặt tham số này thì cài xong MỌI LƯỢT KIỂM ĐỀU LỖI.
  # Phải là https:// — androidScheme là https nên http bị chặn vì nội dung hỗn hợp.
  [string]$ApiGoc = "",
  # ⚠️ CHỌN BẢN BẰNG SỐ, ĐỪNG TRUYỀN `-Frontend` Ở DÒNG LỆNH.
  #    Đây là hệ quả trực tiếp của bẫy ⓪ bên trên: chuỗi tiếng Việt gõ ở dòng lệnh
  #    đi qua bảng mã ANSI của console và méo TRƯỚC KHI tới đây, bất kể tệp này
  #    lưu đúng BOM. Chuỗi phải được GHÉP BÊN TRONG tệp mới đọc đúng.
  #    Bản 3 đang dự thi — có mã native: dải cảnh báo đè màn hình, thông báo
  #    thường trực, nhận nội dung từ nút Chia sẻ của Android.
  [int]$Ban = 3,
  [string]$Frontend = "",
  [string]$ThuMucDung = "D:\khoan-da-build",
  [string]$Sdk = "D:\android-sdk"
)

$ErrorActionPreference = "Stop"

if (-not $Frontend) { $Frontend = "D:\trợ-lý-ảo-khoan-đã ($Ban)" }
if (-not (Test-Path -LiteralPath $Frontend)) {
  Write-Host "Khong thay thu muc frontend (ban $Ban): $Frontend" -ForegroundColor Red
  exit 1
}

# ─── JDK ───
$jdk = Get-ChildItem "C:\Program Files\Microsoft\jdk-*" -Directory -EA SilentlyContinue |
       Select-Object -First 1
if (-not $jdk) {
  Write-Host "Chua co JDK. Cai bang:  winget install --id Microsoft.OpenJDK.17" -ForegroundColor Yellow
  exit 1
}
$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk

if (-not (Test-Path "$Sdk\platform-tools")) {
  Write-Host "Chua co Android SDK o $Sdk." -ForegroundColor Yellow
  Write-Host "Tai commandlinetools roi chay sdkmanager:" -ForegroundColor Yellow
  Write-Host '  platform-tools "platforms;android-34" "build-tools;34.0.0"'
  exit 1
}

# ─── Dựng web ───
Push-Location $Frontend
if ($ApiGoc) {
  Write-Host "Dung web, may chu = $ApiGoc"
  $env:VITE_API_GOC = $ApiGoc
} else {
  Write-Host "⚠️  KHONG dat -ApiGoc: APK se KHONG kiem duoc tin nhan nao." -ForegroundColor Yellow
}
& npm.cmd run build
& npx.cmd cap sync android
Remove-Item Env:\VITE_API_GOC -EA SilentlyContinue
Pop-Location

# ─── Bẫy ① + ② — dựng cây ASCII ───
if (Test-Path $ThuMucDung) { Remove-Item $ThuMucDung -Recurse -Force }
New-Item -ItemType Directory -Force -Path "$ThuMucDung\node_modules\@capacitor" | Out-Null

Copy-Item -LiteralPath "$Frontend\android" -Destination "$ThuMucDung\android" -Recurse -Force
foreach ($p in @("android", "app", "local-notifications")) {
  Copy-Item -LiteralPath "$Frontend\node_modules\@capacitor\$p" `
            -Destination "$ThuMucDung\node_modules\@capacitor\$p" -Recurse -Force
}
Set-Content "$ThuMucDung\android\local.properties" "sdk.dir=$($Sdk -replace '\\','\\')"

# ─── Dựng APK ───
Push-Location "$ThuMucDung\android"
& ".\gradlew.bat" assembleDebug --no-daemon
$ma = $LASTEXITCODE
Pop-Location
if ($ma -ne 0) { Write-Host "Dung that bai (ma $ma)" -ForegroundColor Red; exit $ma }

$apk = "$ThuMucDung\android\app\build\outputs\apk\debug\app-debug.apk"
$ra = "D:\KHOAN-DA-24H\khoan-da.apk"
Copy-Item $apk $ra -Force
$f = Get-Item $ra
Write-Host ""
Write-Host "✔ $ra  —  $([math]::Round($f.Length/1MB,1)) MB" -ForegroundColor Green
Write-Host "  Cai:  adb install -r `"$ra`""
