# 互動式客製化表單系統 - 數據庫 ER 圖設計

## 概述

本系統採用 PostgreSQL 作為主要資料庫，使用關聯式資料庫設計來管理表單、使用者、回應等核心實體。

## 實體關係圖

```
┌─────────────┐       ┌─────────────┐
│    Users    │       │    Forms    │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ id (PK)     │
│ username    │       │ title        │
│ email       │       │ description  │
│ password    │       │ creator_id   │
│ role        │       │ created_at   │
│ created_at  │       │ updated_at   │
│ updated_at  │       │ published    │
└─────────────┘       │ settings     │
        │             └─────────────┘
        │                     │
        │                     │
        │ 1..*                │ 1..*
        ▼                     ▼
┌─────────────┐       ┌─────────────┐
│  Responses  │       │  Questions  │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ form_id     │◄──────┤ form_id      │
│ user_id     │       │ question_text│
│ submitted_at│       │ question_type│
│ status      │       │ required     │
│             │       │ options      │
└─────────────┘       │ order_index  │
        │             └─────────────┘
        │
        │ 1..*
        ▼
┌─────────────┐       ┌─────────────┐
│   Answers   │       │    Files    │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ response_id │◄──────┤ filename     │
│ question_id │       │ filepath     │
│ answer_text │       │ file_size    │
│             │       │ mime_type    │
└─────────────┘       │ uploaded_at  │
                             │
                             │
                             ▼
                        ┌─────────────┐
                        │File_Storage │
                        │(MinIO)      │
                        └─────────────┘

┌─────────────┐
│Refresh      │
│Tokens       │
├─────────────┤
│ id (PK)     │
│ user_id     │
│ token_hash  │
│ expires_at  │
│ created_at  │
│ revoked     │
└─────────────┘
```

## 實體詳細說明

### 1. Users (使用者表)
- **id**: 主鍵，UUID 或自增整數
- **username**: 使用者名稱，唯一
- **email**: 電子郵件，唯一
- **password**: 加密密碼
- **role**: 使用者角色 (admin, user)
- **created_at**: 建立時間
- **updated_at**: 更新時間

### 2. Forms (表單表)
- **id**: 主鍵
- **title**: 表單標題
- **description**: 表單描述
- **creator_id**: 建立者 ID (外鍵指向 Users)
- **created_at**: 建立時間
- **updated_at**: 更新時間
- **published**: 是否發布
- **settings**: 表單設定 (JSON 格式)

### 3. Questions (題目表)
- **id**: 主鍵
- **form_id**: 所屬表單 ID (外鍵指向 Forms)
- **question_text**: 題目內容
- **question_type**: 題型 (short_answer, long_answer, single_choice, multiple_choice, file_upload)
- **required**: 是否必填
- **options**: 選項 (JSON 格式，適用於選擇題)
- **order_index**: 顯示順序

### 4. Responses (回應表)
- **id**: 主鍵
- **form_id**: 表單 ID (外鍵指向 Forms)
- **user_id**: 填寫者 ID (外鍵指向 Users，可為空允許匿名)
- **submitted_at**: 提交時間
- **status**: 狀態 (draft, submitted)

### 5. Answers (答案表)
- **id**: 主鍵
- **response_id**: 回應 ID (外鍵指向 Responses)
- **question_id**: 題目 ID (外鍵指向 Questions)
- **answer_text**: 答案內容 (文字答案)
- **file_ids**: 附加檔案 ID 列表 (JSON 格式)

### 6. Files (檔案表)
- **id**: 主鍵
- **filename**: 原始檔案名稱
- **filepath**: MinIO 中的路徑
- **file_size**: 檔案大小
- **mime_type**: MIME 類型
- **uploaded_at**: 上傳時間
- **answer_id**: 所屬答案 ID (外鍵指向 Answers)

### 7. Refresh Tokens (刷新令牌表)
- **id**: 主鍵
- **user_id**: 使用者 ID (外鍵指向 Users)
- **token_hash**: 令牌雜湊值 (SHA-256)
- **expires_at**: 到期時間
- **created_at**: 創建時間
- **revoked**: 是否已撤銷

## 索引設計

### 主要索引
- Users: email (唯一索引)
- Forms: creator_id
- Questions: form_id, order_index
- Responses: form_id, user_id, submitted_at
- Answers: response_id, question_id
- Files: answer_id
- Refresh Tokens: user_id, token_hash, expires_at

### 複合索引
- Responses: (form_id, submitted_at)
- Answers: (response_id, question_id)

## 資料完整性約束

### 外鍵約束
- Forms.creator_id → Users.id
- Questions.form_id → Forms.id
- Responses.form_id → Forms.id
- Responses.user_id → Users.id (可為空)
- Answers.response_id → Responses.id
- Answers.question_id → Questions.id
- Files.answer_id → Answers.id
- Refresh Tokens.user_id → Users.id

### 檢查約束
- question_type 必須是預定義的值
- role 必須是預定義的值
- status 必須是預定義的值

## 備註

- 所有時間欄位使用 TIMESTAMP WITH TIME ZONE
- 使用 UUID 作為主鍵以確保分散式系統相容性
- 敏感資料使用適當加密
- 大檔案儲存於 MinIO，資料庫只存儲元資料