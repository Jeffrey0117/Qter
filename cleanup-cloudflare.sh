#!/bin/bash

# Cloudflare 資源清理腳本
# 此腳本幫助你刪除 Cloudflare Workers、D1 資料庫和 KV 命名空間

echo "=========================================="
echo "  Cloudflare 資源清理工具"
echo "=========================================="
echo ""
echo "警告：此操作將刪除以下資源："
echo "  - Cloudflare Workers (qter-api)"
echo "  - D1 資料庫 (qter-db)"
echo "  - KV 命名空間 (RATE_LIMIT)"
echo ""
echo "資料將無法恢復！"
echo ""

# 確認操作
read -p "確定要繼續嗎？ (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消。"
    exit 0
fi

echo ""
echo "開始清理 Cloudflare 資源..."
echo ""

# 檢查 wrangler 是否已安裝
if ! command -v wrangler &> /dev/null; then
    echo "錯誤：wrangler 未安裝。"
    echo "請執行：npm install -g wrangler"
    exit 1
fi

# 檢查是否已登入
echo "1. 檢查登入狀態..."
if ! wrangler whoami &> /dev/null; then
    echo "錯誤：請先登入 Cloudflare。"
    echo "執行：wrangler login"
    exit 1
fi
echo "✓ 已登入"
echo ""

# 刪除 Workers
echo "2. 刪除 Cloudflare Workers..."
if wrangler delete qter-api --force 2>/dev/null; then
    echo "✓ Workers 'qter-api' 已刪除"
else
    echo "⚠ Workers 'qter-api' 不存在或已刪除"
fi
echo ""

# 刪除 D1 資料庫
echo "3. 刪除 D1 資料庫..."
# 列出所有 D1 資料庫
databases=$(wrangler d1 list 2>/dev/null | grep qter-db)

if [ -n "$databases" ]; then
    # 從 wrangler.toml 讀取 database_id
    if [ -f "wrangler.toml" ]; then
        db_id=$(grep "database_id" wrangler.toml | sed 's/.*"\(.*\)".*/\1/')
        if [ -n "$db_id" ]; then
            echo "找到資料庫 ID: $db_id"
            if wrangler d1 delete $db_id --force 2>/dev/null; then
                echo "✓ D1 資料庫 'qter-db' 已刪除"
            else
                echo "⚠ 無法自動刪除 D1 資料庫，請手動刪除"
                echo "  執行：wrangler d1 delete $db_id"
            fi
        else
            echo "⚠ 無法從 wrangler.toml 讀取 database_id"
            echo "請手動刪除 D1 資料庫"
        fi
    else
        echo "⚠ wrangler.toml 不存在"
    fi
else
    echo "⚠ D1 資料庫 'qter-db' 不存在或已刪除"
fi
echo ""

# 刪除 KV 命名空間
echo "4. 刪除 KV 命名空間..."
# 列出所有 KV 命名空間
kv_list=$(wrangler kv:namespace list 2>/dev/null)

if echo "$kv_list" | grep -q "RATE_LIMIT"; then
    # 從 wrangler.toml 讀取 KV namespace_id
    if [ -f "wrangler.toml" ]; then
        kv_id=$(grep -A 2 "kv_namespaces" wrangler.toml | grep "id" | sed 's/.*"\(.*\)".*/\1/')
        if [ -n "$kv_id" ] && [ "$kv_id" != "YOUR_KV_NAMESPACE_ID" ]; then
            echo "找到 KV 命名空間 ID: $kv_id"
            if wrangler kv:namespace delete --namespace-id=$kv_id --force 2>/dev/null; then
                echo "✓ KV 命名空間 'RATE_LIMIT' 已刪除"
            else
                echo "⚠ 無法自動刪除 KV 命名空間，請手動刪除"
                echo "  執行：wrangler kv:namespace delete --namespace-id=$kv_id"
            fi
        else
            echo "⚠ 無法從 wrangler.toml 讀取有效的 namespace_id"
            echo "請手動刪除 KV 命名空間"
        fi
    fi
else
    echo "⚠ KV 命名空間 'RATE_LIMIT' 不存在或已刪除"
fi
echo ""

# 清理本地檔案（可選）
echo "5. 清理本地 Cloudflare 相關檔案..."
read -p "是否刪除本地 Cloudflare 相關檔案？ (yes/no): " cleanup_files

if [ "$cleanup_files" == "yes" ]; then
    # 刪除 wrangler.toml
    if [ -f "wrangler.toml" ]; then
        rm wrangler.toml
        echo "✓ 已刪除 wrangler.toml"
    fi

    # 刪除 .wrangler 目錄
    if [ -d ".wrangler" ]; then
        rm -rf .wrangler
        echo "✓ 已刪除 .wrangler 目錄"
    fi

    # 刪除 api/worker 目錄
    if [ -d "api/worker" ]; then
        rm -rf api/worker
        echo "✓ 已刪除 api/worker 目錄"
    fi

    # 刪除 Cloudflare 相關文檔
    if [ -f "CLOUDFLARE_DEPLOY.md" ]; then
        rm CLOUDFLARE_DEPLOY.md
        echo "✓ 已刪除 CLOUDFLARE_DEPLOY.md"
    fi

    if [ -f "DEPLOYMENT.md" ]; then
        rm DEPLOYMENT.md
        echo "✓ 已刪除 DEPLOYMENT.md"
    fi

    if [ -f "QUICK_DEPLOY.md" ]; then
        rm QUICK_DEPLOY.md
        echo "✓ 已刪除 QUICK_DEPLOY.md"
    fi

    echo "✓ 本地檔案清理完成"
else
    echo "跳過本地檔案清理"
fi
echo ""

echo "=========================================="
echo "  清理完成！"
echo "=========================================="
echo ""
echo "後續步驟："
echo "1. 如需完全移除 Cloudflare 設定，請前往 Cloudflare Dashboard 確認"
echo "2. 參考 SUPABASE_DEPLOY.md 設定新的 Supabase 後端"
echo "3. 更新前端環境變數為 Supabase 設定"
echo ""
echo "Cloudflare Dashboard: https://dash.cloudflare.com"
echo ""
