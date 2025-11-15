@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Cloudflare 資源清理腳本 (Windows 版本)
:: 此腳本幫助你刪除 Cloudflare Workers、D1 資料庫和 KV 命名空間

echo ==========================================
echo   Cloudflare 資源清理工具
echo ==========================================
echo.
echo 警告：此操作將刪除以下資源：
echo   - Cloudflare Workers (qter-api)
echo   - D1 資料庫 (qter-db)
echo   - KV 命名空間 (RATE_LIMIT)
echo.
echo 資料將無法恢復！
echo.

:: 確認操作
set /p confirm="確定要繼續嗎？ (yes/no): "
if /i not "%confirm%"=="yes" (
    echo 操作已取消。
    exit /b 0
)

echo.
echo 開始清理 Cloudflare 資源...
echo.

:: 檢查 wrangler 是否已安裝
where wrangler >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 錯誤：wrangler 未安裝。
    echo 請執行：npm install -g wrangler
    exit /b 1
)

:: 檢查是否已登入
echo 1. 檢查登入狀態...
wrangler whoami >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 錯誤：請先登入 Cloudflare。
    echo 執行：wrangler login
    exit /b 1
)
echo ✓ 已登入
echo.

:: 刪除 Workers
echo 2. 刪除 Cloudflare Workers...
wrangler delete qter-api --force >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✓ Workers 'qter-api' 已刪除
) else (
    echo ⚠ Workers 'qter-api' 不存在或已刪除
)
echo.

:: 刪除 D1 資料庫
echo 3. 刪除 D1 資料庫...
echo 請手動執行以下指令刪除 D1 資料庫：
echo   wrangler d1 list
echo   wrangler d1 delete [database-id]
echo.

:: 刪除 KV 命名空間
echo 4. 刪除 KV 命名空間...
echo 請手動執行以下指令刪除 KV 命名空間：
echo   wrangler kv:namespace list
echo   wrangler kv:namespace delete --namespace-id=[id]
echo.

:: 清理本地檔案（可選）
echo 5. 清理本地 Cloudflare 相關檔案...
set /p cleanup_files="是否刪除本地 Cloudflare 相關檔案？ (yes/no): "

if /i "%cleanup_files%"=="yes" (
    :: 刪除 wrangler.toml
    if exist "wrangler.toml" (
        del /f /q "wrangler.toml"
        echo ✓ 已刪除 wrangler.toml
    )

    :: 刪除 .wrangler 目錄
    if exist ".wrangler" (
        rmdir /s /q ".wrangler"
        echo ✓ 已刪除 .wrangler 目錄
    )

    :: 刪除 api/worker 目錄
    if exist "api\worker" (
        rmdir /s /q "api\worker"
        echo ✓ 已刪除 api\worker 目錄
    )

    :: 刪除整個 api 目錄（如果為空）
    if exist "api" (
        rmdir "api" 2>nul
        if %ERRORLEVEL% equ 0 (
            echo ✓ 已刪除空的 api 目錄
        )
    )

    :: 刪除 Cloudflare 相關文檔
    if exist "CLOUDFLARE_DEPLOY.md" (
        del /f /q "CLOUDFLARE_DEPLOY.md"
        echo ✓ 已刪除 CLOUDFLARE_DEPLOY.md
    )

    if exist "DEPLOYMENT.md" (
        del /f /q "DEPLOYMENT.md"
        echo ✓ 已刪除 DEPLOYMENT.md
    )

    if exist "QUICK_DEPLOY.md" (
        del /f /q "QUICK_DEPLOY.md"
        echo ✓ 已刪除 QUICK_DEPLOY.md
    )

    if exist "deploy.bat" (
        del /f /q "deploy.bat"
        echo ✓ 已刪除 deploy.bat
    )

    if exist "setup-test-data.sql" (
        del /f /q "setup-test-data.sql"
        echo ✓ 已刪除 setup-test-data.sql
    )

    echo ✓ 本地檔案清理完成
) else (
    echo 跳過本地檔案清理
)
echo.

echo ==========================================
echo   清理完成！
echo ==========================================
echo.
echo 後續步驟：
echo 1. 如需完全移除 Cloudflare 設定，請前往 Cloudflare Dashboard 確認
echo 2. 參考 SUPABASE_DEPLOY.md 設定新的 Supabase 後端
echo 3. 更新前端環境變數為 Supabase 設定
echo.
echo Cloudflare Dashboard: https://dash.cloudflare.com
echo.

pause
