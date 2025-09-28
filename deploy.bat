@echo off
echo QTER 部署腳本 (Windows)
echo =======================
echo.

REM 檢查是否已登入 Cloudflare
echo 步驟 1: 檢查 Cloudflare 登入狀態...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo 請先登入 Cloudflare:
    wrangler login
)

REM 檢查設定
echo.
echo 步驟 2: 檢查 wrangler.toml 設定...
findstr "YOUR_DATABASE_ID_HERE" wrangler.toml >nul
if not errorlevel 1 (
    echo 警告: 請先設定 D1 Database ID
    echo 執行: wrangler d1 create qter-db
    echo 然後更新 wrangler.toml 中的 database_id
    pause
    exit /b 1
)

findstr "YOUR_KV_NAMESPACE_ID_HERE" wrangler.toml >nul
if not errorlevel 1 (
    echo 警告: 請先設定 KV Namespace ID
    echo 執行: wrangler kv:namespace create RATE_LIMIT
    echo 然後更新 wrangler.toml 中的 id
    pause
    exit /b 1
)

echo 成功: wrangler.toml 設定完成

REM 選擇部署類型
echo.
echo 步驟 3: 選擇部署類型
echo 1) 只部署後端 (Cloudflare Workers)
echo 2) 只部署前端 (Vercel)
echo 3) 完整部署 (後端 + 前端)
set /p choice="請選擇 (1/2/3): "

if "%choice%"=="1" goto deploy_backend
if "%choice%"=="2" goto deploy_frontend
if "%choice%"=="3" goto deploy_full
echo 無效選擇
pause
exit /b 1

:deploy_backend
echo.
echo 部署後端到 Cloudflare Workers...
echo 套用資料庫 schema...
wrangler d1 migrations apply qter-db --remote
echo 部署 Workers...
wrangler deploy
echo.
echo 成功: 後端部署完成！
echo Workers URL 會顯示在上方
pause
exit /b 0

:deploy_frontend
echo.
echo 部署前端到 Vercel...
if not exist "frontend\.env.production" (
    set /p api_url="請輸入你的 Workers API URL (例如 https://qter-api.xxx.workers.dev): "
    echo VITE_API_BASE_URL=%api_url%/api > frontend\.env.production
)
cd frontend
vercel --prod
cd ..
echo.
echo 成功: 前端部署完成！
pause
exit /b 0

:deploy_full
echo.
echo 執行完整部署...
echo 步驟 3.1: 部署後端...
wrangler d1 migrations apply qter-db --remote
wrangler deploy
echo.
set /p dummy="請複製上方的 Workers URL，然後按 Enter 繼續..."
set /p api_url="輸入 Workers URL (例如 https://qter-api.xxx.workers.dev): "
echo VITE_API_BASE_URL=%api_url%/api > frontend\.env.production
echo.
echo 步驟 3.2: 部署前端...
cd frontend
vercel --prod
cd ..
echo.
echo 成功: 完整部署完成！
echo.
echo 測試連結：
echo 1. 前端首頁：檢查 Vercel 輸出的 URL
echo 2. 測試問卷：https://你的專案.vercel.app/demo
echo 3. 公開分享：https://你的專案.vercel.app/s/demo12345678
pause
exit /b 0