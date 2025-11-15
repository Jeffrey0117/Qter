#!/bin/bash

# QTER Supabase 快速設定腳本
# 用於初始化本地 Supabase 環境

set -e

echo "========================================="
echo "QTER Supabase 快速設定"
echo "========================================="
echo ""

# 檢查 Supabase CLI 是否已安裝
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安裝"
    echo "請執行: npm install -g supabase"
    echo "或參考: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI 已安裝"
echo ""

# 檢查是否已經初始化
if [ ! -f "supabase/config.toml" ]; then
    echo "初始化 Supabase 專案..."
    supabase init
    echo "✅ Supabase 專案已初始化"
else
    echo "✅ Supabase 專案已存在"
fi
echo ""

# 啟動本地 Supabase
echo "啟動本地 Supabase 服務..."
echo "（這可能需要幾分鐘時間，請耐心等待）"
echo ""

if ! supabase status &> /dev/null; then
    supabase start
else
    echo "✅ Supabase 服務已在運行"
fi
echo ""

# 顯示連接資訊
echo "========================================="
echo "本地 Supabase 服務資訊"
echo "========================================="
supabase status
echo ""

# 執行遷移
echo "========================================="
echo "執行資料庫遷移"
echo "========================================="
echo ""

# 檢查是否有 migrations 目錄
if [ -d "supabase/migrations" ]; then
    echo "應用資料庫 schema..."
    supabase db reset --db-url "$(supabase status -o env | grep DATABASE_URL | cut -d'=' -f2)"
    echo "✅ 資料庫 schema 已應用"
else
    echo "⚠️  找不到 migrations 目錄"
fi
echo ""

# 生成 TypeScript 類型
echo "========================================="
echo "生成 TypeScript 類型定義"
echo "========================================="
echo ""

TYPES_DIR="../frontend/src/types"
if [ ! -d "$TYPES_DIR" ]; then
    echo "創建類型目錄: $TYPES_DIR"
    mkdir -p "$TYPES_DIR"
fi

echo "生成資料庫類型..."
supabase gen types typescript --local > "$TYPES_DIR/database.types.ts"
echo "✅ TypeScript 類型已生成到: $TYPES_DIR/database.types.ts"
echo ""

# 顯示下一步指示
echo "========================================="
echo "✅ 設定完成！"
echo "========================================="
echo ""
echo "📝 下一步："
echo ""
echo "1. 查看 Supabase Studio:"
echo "   開啟瀏覽器訪問 Studio URL (見上方輸出)"
echo ""
echo "2. 獲取 API 憑證:"
echo "   - API URL: 見上方 API URL"
echo "   - anon key: 見上方 anon key"
echo "   - service_role key: 見上方 service_role key"
echo ""
echo "3. 更新前端環境變數:"
echo "   在 frontend/.env 中設定："
echo "   VITE_SUPABASE_URL=<API URL>"
echo "   VITE_SUPABASE_ANON_KEY=<anon key>"
echo ""
echo "4. 更新後端環境變數:"
echo "   在 api/.dev.vars 中設定："
echo "   SUPABASE_URL=<API URL>"
echo "   SUPABASE_SERVICE_KEY=<service_role key>"
echo ""
echo "5. 測試資料庫連接:"
echo "   supabase db push"
echo ""
echo "6. 停止服務:"
echo "   supabase stop"
echo ""
echo "========================================="
echo "📚 更多資訊請參考 supabase/README.md"
echo "========================================="
