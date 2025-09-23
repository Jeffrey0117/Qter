# 資料庫設置說明

## PostgreSQL 資料庫創建

### 1. 安裝 PostgreSQL
請確保已安裝 PostgreSQL 13+ 版本。

### 2. 創建資料庫
```sql
-- 連接到 PostgreSQL
psql -U postgres

-- 創建資料庫
CREATE DATABASE form_system;
```

### 3. 創建使用者 (可選)
```sql
-- 創建專用使用者
CREATE USER form_user WITH PASSWORD 'your_password_here';

-- 授權
GRANT ALL PRIVILEGES ON DATABASE form_system TO form_user;
```

### 4. 環境變數配置
在後端的 `.env` 檔案中設置：
```
DATABASE_URL=postgresql://form_user:your_password_here@localhost:5432/form_system
```

## Migration 腳本執行

### 使用手動 SQL 腳本
```bash
# 連接到資料庫
psql -U form_user -d form_system

# 執行 migration 腳本
\i migrations/001_create_users_table.sql
\i migrations/002_create_forms_table.sql
\i migrations/003_create_questions_table.sql
\i migrations/004_create_responses_table.sql
\i migrations/005_create_answers_table.sql
\i migrations/006_create_files_table.sql
\i migrations/007_create_indexes.sql
```

### 使用工具 (推薦)
考慮使用 migration 工具如：
- [db-migrate](https://github.com/db-migrate/node-db-migrate)
- [Knex.js](https://knexjs.org/)
- [Prisma](https://www.prisma.io/)

## 種子資料

執行種子腳本：
```bash
psql -U form_user -d form_system -f seeds/001_admin_user.sql
```

## 備份與還原

### 備份
```bash
pg_dump -U form_user -d form_system > backup.sql
```

### 還原
```bash
psql -U form_user -d form_system < backup.sql
```

## 監控

基本監控查詢：
```sql
-- 檢查連線
SELECT * FROM pg_stat_activity;

-- 檢查資料庫大小
SELECT pg_size_pretty(pg_database_size('form_system'));

-- 檢查表大小
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;