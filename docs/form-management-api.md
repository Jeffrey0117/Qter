# 表單管理 API 文檔

## 概述

表單管理 API 提供完整的表單 CRUD 操作、題目管理、發布狀態控制等功能。所有私有 API 都需要 JWT 認證。

## 認證

所有 API 請求都需要在 `Authorization` header 中包含 Bearer token：

```
Authorization: Bearer <your-jwt-token>
```

## API 端點

### 表單 CRUD

#### 獲取使用者表單列表

- **端點**: `GET /api/forms`
- **權限**: 私有
- **查詢參數**:
  - `published` (boolean, 可選): 篩選發布狀態
  - `search` (string, 可選): 搜尋標題或描述
  - `limit` (number, 可選, 預設 10): 每頁數量
  - `offset` (number, 可選, 預設 0): 偏移量

**回應範例**:
```json
{
  "status": "success",
  "results": 2,
  "total": 15,
  "data": {
    "forms": [
      {
        "id": 1,
        "title": "客戶滿意度調查",
        "description": "請協助我們改進服務",
        "settings": {},
        "published": true,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "questions": [
          {
            "id": 1,
            "question_text": "您對我們的服務滿意嗎？",
            "question_type": "single_choice",
            "required": true,
            "options": ["非常滿意", "滿意", "不滿意"],
            "order_index": 0
          }
        ]
      }
    ]
  }
}
```

#### 獲取單個表單詳情

- **端點**: `GET /api/forms/:id`
- **權限**: 私有 (僅表單創建者)

**回應範例**:
```json
{
  "status": "success",
  "data": {
    "form": {
      "id": 1,
      "title": "客戶滿意度調查",
      "description": "請協助我們改進服務",
      "settings": {},
      "published": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "questions": [...]
    }
  }
}
```

#### 創建新表單

- **端點**: `POST /api/forms`
- **權限**: 私有
- **請求體**:
```json
{
  "title": "新表單標題",
  "description": "表單描述",
  "settings": {}
}
```

#### 更新表單

- **端點**: `PUT /api/forms/:id`
- **權限**: 私有 (僅表單創建者)
- **請求體** (所有欄位皆為可選):
```json
{
  "title": "更新後的標題",
  "description": "更新後的描述",
  "settings": {},
  "published": true
}
```

#### 刪除表單

- **端點**: `DELETE /api/forms/:id`
- **權限**: 私有 (僅表單創建者)

### 表單操作

#### 複製表單

- **端點**: `POST /api/forms/:id/duplicate`
- **權限**: 私有 (僅表單創建者)

#### 切換發布狀態

- **端點**: `PATCH /api/forms/:id/publish`
- **權限**: 私有 (僅表單創建者)
- **請求體**:
```json
{
  "published": true
}
```

#### 獲取公開表單 (用於填寫)

- **端點**: `GET /api/forms/public/:id`
- **權限**: 公開

### 題目管理

#### 獲取表單所有題目

- **端點**: `GET /api/forms/:formId/questions`
- **權限**: 私有 (僅表單創建者)

#### 獲取單個題目詳情

- **端點**: `GET /api/forms/:formId/questions/:questionId`
- **權限**: 私有 (僅表單創建者)

#### 創建新題目

- **端點**: `POST /api/forms/:formId/questions`
- **權限**: 私有 (僅表單創建者)
- **請求體**:
```json
{
  "question_text": "您的年齡是？",
  "question_type": "single_choice",
  "required": true,
  "options": ["18-25", "26-35", "36-45", "46以上"]
}
```

**支援的問題類型**:
- `short_answer`: 簡答題
- `long_answer`: 詳答題
- `single_choice`: 單選題
- `multiple_choice`: 多選題
- `file_upload`: 檔案上傳

#### 批量創建題目

- **端點**: `POST /api/forms/:formId/questions/batch`
- **權限**: 私有 (僅表單創建者)
- **請求體**:
```json
{
  "questions": [
    {
      "question_text": "您的姓名是？",
      "question_type": "short_answer",
      "required": true
    },
    {
      "question_text": "您的意見是？",
      "question_type": "long_answer",
      "required": false
    }
  ]
}
```

#### 更新題目

- **端點**: `PUT /api/forms/:formId/questions/:questionId`
- **權限**: 私有 (僅表單創建者)
- **請求體** (所有欄位皆為可選):
```json
{
  "question_text": "更新後的問題",
  "question_type": "multiple_choice",
  "required": false,
  "options": ["選項A", "選項B", "選項C"]
}
```

#### 刪除題目

- **端點**: `DELETE /api/forms/:formId/questions/:questionId`
- **權限**: 私有 (僅表單創建者)

#### 重新排序題目

- **端點**: `PATCH /api/forms/:formId/questions/reorder`
- **權限**: 私有 (僅表單創建者)
- **請求體**:
```json
{
  "questionOrders": [
    { "id": 1, "order_index": 0 },
    { "id": 2, "order_index": 1 },
    { "id": 3, "order_index": 2 }
  ]
}
```

## 錯誤處理

所有 API 都會返回統一的錯誤格式：

```json
{
  "status": "error",
  "message": "錯誤訊息"
}
```

**常見錯誤**:
- `400 Bad Request`: 請求參數錯誤
- `401 Unauthorized`: 未認證或 token 無效
- `403 Forbidden`: 無權限訪問
- `404 Not Found`: 資源不存在

## 權限控制

- 所有私有 API 都需要有效的 JWT token
- 表單相關操作僅限表單創建者
- 管理員角色可以訪問所有資源
- 公開表單 API 不需要認證，但只有已發布的表單才能訪問

## 資料驗證

- 表單標題必填且不能為空
- 問題文字必填且不能為空
- 問題類型必須為支援的類型之一
- 排序操作中的題目 ID 必須存在於指定表單中