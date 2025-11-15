# QTER Supabase 快速設定腳本 (PowerShell)
# 用於初始化本地 Supabase 環境

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "QTER Supabase 快速設定" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Supabase CLI 是否已安裝
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI 已安裝" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI 未安裝" -ForegroundColor Red
    Write-Host "請執行: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "或參考: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 檢查是否已經初始化
if (-not (Test-Path "supabase\config.toml")) {
    Write-Host "初始化 Supabase 專案..." -ForegroundColor Yellow
    supabase init
    Write-Host "✅ Supabase 專案已初始化" -ForegroundColor Green
} else {
    Write-Host "✅ Supabase 專案已存在" -ForegroundColor Green
}
Write-Host ""

# 啟動本地 Supabase
Write-Host "啟動本地 Supabase 服務..." -ForegroundColor Yellow
Write-Host "（這可能需要幾分鐘時間，請耐心等待）" -ForegroundColor Yellow
Write-Host ""

try {
    $status = supabase status 2>&1
    Write-Host "✅ Supabase 服務已在運行" -ForegroundColor Green
} catch {
    supabase start
}
Write-Host ""

# 顯示連接資訊
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "本地 Supabase 服務資訊" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
supabase status
Write-Host ""

# 執行遷移
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "執行資料庫遷移" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查是否有 migrations 目錄
if (Test-Path "supabase\migrations") {
    Write-Host "應用資料庫 schema..." -ForegroundColor Yellow

    # 獲取資料庫 URL
    $dbUrl = (supabase status -o env | Select-String "DATABASE_URL").ToString().Split("=")[1]

    supabase db reset --db-url $dbUrl
    Write-Host "✅ 資料庫 schema 已應用" -ForegroundColor Green
} else {
    Write-Host "⚠️  找不到 migrations 目錄" -ForegroundColor Yellow
}
Write-Host ""

# 生成 TypeScript 類型
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "生成 TypeScript 類型定義" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$typesDir = "..\frontend\src\types"
if (-not (Test-Path $typesDir)) {
    Write-Host "創建類型目錄: $typesDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $typesDir -Force | Out-Null
}

Write-Host "生成資料庫類型..." -ForegroundColor Yellow
supabase gen types typescript --local | Out-File -FilePath "$typesDir\database.types.ts" -Encoding UTF8
Write-Host "✅ TypeScript 類型已生成到: $typesDir\database.types.ts" -ForegroundColor Green
Write-Host ""

# 顯示下一步指示
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ 設定完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 下一步：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 查看 Supabase Studio:"
Write-Host "   開啟瀏覽器訪問 Studio URL (見上方輸出)"
Write-Host ""
Write-Host "2. 獲取 API 憑證:"
Write-Host "   - API URL: 見上方 API URL"
Write-Host "   - anon key: 見上方 anon key"
Write-Host "   - service_role key: 見上方 service_role key"
Write-Host ""
Write-Host "3. 更新前端環境變數:"
Write-Host "   在 frontend\.env 中設定："
Write-Host "   VITE_SUPABASE_URL=<API URL>"
Write-Host "   VITE_SUPABASE_ANON_KEY=<anon key>"
Write-Host ""
Write-Host "4. 更新後端環境變數:"
Write-Host "   在 api\.dev.vars 中設定："
Write-Host "   SUPABASE_URL=<API URL>"
Write-Host "   SUPABASE_SERVICE_KEY=<service_role key>"
Write-Host ""
Write-Host "5. 測試資料庫連接:"
Write-Host "   supabase db push"
Write-Host ""
Write-Host "6. 停止服務:"
Write-Host "   supabase stop"
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📚 更多資訊請參考 supabase\README.md" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
