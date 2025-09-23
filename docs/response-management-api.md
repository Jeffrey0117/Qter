# 回應管理 API 文檔

## 概述
此文檔描述表單回應管理相關的 API 端點，包括提交回應、查看回應、統計分析和資料匯出等功能。

## API 端點

### 1. 提交表單回應
**端點**: `POST /api/forms/:formId/responses`

**權限**: 公開 (支援匿名提交)

**描述**: 提交表單回應

**請求參數**:
- `formId` (路徑參數): 表單 ID

**請求主體**:
```json
{
  "answers": [
    {
      "questionId": 1,
      "value": "答案內容"
    },
    {
      "questionId": 2,
      "value": ["選項1", "選項2"]  // 多選題
    }
  ]
}
```

**回應**:
- 成功 (201):
```json
{
  "message": "回應提交成功",
  "responseId": 123
}
```
- 錯誤 (400): 表單未發布、已結束、達到數量上限或必填欄位未填
- 錯誤 (404): 表單不存在

---

### 2. 獲取表單回應列表
**端點**: `GET /api/forms/:formId/responses`

**權限**: 需要登入 (表單擁有者)

**描述**: 獲取指定表單的所有回應

**查詢參數**:
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁筆數 (預設: 20)
- `search`: 搜尋關鍵字
- `startDate`: 開始日期 (ISO 8601 格式)
- `endDate`: 結束日期 (ISO 8601 格式)
- `sortBy`: 排序欄位 (預設: submitted_at)
- `sortOrder`: 排序方向 (ASC/DESC，預設: DESC)

**回應**:
```json
{
  "responses": [
    {
      "id": 1,
      "respondent_id": 123,
      "submitted_at": "2024-01-20T10:30:00Z",
      "ip_address": "192.168.1.1",
      "respondent_name": "John Doe",
      "respondent_email": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 3. 獲取單一回應詳情
**端點**: `GET /api/responses/:responseId`

**權限**: 需要登入 (表單擁有者)

**描述**: 獲取特定回應的詳細資料

**回應**:
```json
{
  "id": 1,
  "form_id": 10,
  "form_title": "客戶滿意度調查",
  "respondent_id": 123,
  "respondent_name": "John Doe",
  "respondent_email": "john@example.com",
  "submitted_at": "2024-01-20T10:30:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "answers": [
    {
      "id": 1,
      "questionId": 1,
      "questionTitle": "您對我們的服務滿意嗎？",
      "questionType": "radio",
      "value": "非常滿意"
    },
    {
      "id": 2,
      "questionId": 2,
      "questionTitle": "您最喜歡哪些功能？",
      "questionType": "checkbox",
      "value": ["功能A", "功能B"]
    }
  ]
}
```

---

### 4. 獲取表單統計資料
**端點**: `GET /api/forms/:formId/statistics`

**權限**: 需要登入 (表單擁有者)

**描述**: 獲取表單的統計分析資料

**查詢參數**:
- `startDate`: 開始日期 (ISO 8601 格式)
- `endDate`: 結束日期 (ISO 8601 格式)

**回應**:
```json
{
  "formTitle": "客戶滿意度調查",
  "overview": {
    "total_responses": 150,
    "unique_respondents": 145,
    "avg_completion_time_minutes": 5.3,
    "first_response_at": "2024-01-01T08:00:00Z",
    "last_response_at": "2024-01-20T18:00:00Z"
  },
  "questionStatistics": [
    {
      "questionId": 1,
      "title": "您對我們的服務滿意嗎？",
      "type": "radio",
      "required": true,
      "statistics": {
        "distribution": {
          "非常滿意": 80,
          "滿意": 50,
          "普通": 15,
          "不滿意": 5
        }
      }
    },
    {
      "questionId": 2,
      "title": "請為我們的服務評分",
      "type": "rating",
      "required": true,
      "statistics": {
        "distribution": {
          "1": 2,
          "2": 3,
          "3": 20,
          "4": 55,
          "5": 70
        },
        "average": "4.25"
      }
    },
    {
      "questionId": 3,
      "title": "您最喜歡哪些功能？",
      "type": "checkbox",
      "required": false,
      "statistics": {
        "distribution": {
          "功能A": 100,
          "功能B": 85,
          "功能C": 60,
          "功能D": 45
        }
      }
    },
    {
      "questionId": 4,
      "title": "其他建議",
      "type": "text",
      "required": false,
      "statistics": {
        "responseCount": 75,
        "sampleAnswers": [
          "希望增加更多功能",
          "介面可以更簡潔",
          "整體很滿意",
          "價格可以再優惠一些",
          "客服回應很快"
        ]
      }
    }
  ],
  "submissionTrend": [
    {
      "date": "2024-01-01",
      "count": 15
    },
    {
      "date": "2024-01-02",
      "count": 22
    },
    {
      "date": "2024-01-03",
      "count": 18
    }
  ]
}
```

---

### 5. 匯出表單回應
**端點**: `GET /api/forms/:formId/export`

**權限**: 需要登入 (表單擁有者)

**描述**: 匯出表單回應資料

**查詢參數**:
- `format`: 匯出格式 (`csv` 或 `excel`/`xlsx`，預設: csv)
- `startDate`: 開始日期 (ISO 8601 格式)
- `endDate`: 結束日期 (ISO 8601 格式)

**回應**:
- 成功: 直接下載檔案
- 錯誤 (404): 沒有回應資料可匯出

**匯出格式範例** (CSV):
```csv
回應編號,提交時間,填寫者名稱,填寫者信箱,IP 位址,Q1. 您對我們的服務滿意嗎？,Q2. 您最喜歡哪些功能？
1,2024-01-20 18:30:00,John Doe,john@example.com,192.168.1.1,非常滿意,"功能A, 功能B"
2,2024-01-20 19:00:00,匿名,,192.168.1.2,滿意,功能C
```

---

### 6. 編輯回應
**端點**: `PUT /api/responses/:responseId`

**權限**: 需要登入 (表單擁有者)

**描述**: 編輯已提交的回應 (僅管理員功能)

**請求主體**:
```json
{
  "answers": [
    {
      "questionId": 1,
      "value": "修改後的答案"
    },
    {
      "questionId": 2,
      "value": ["新選項1", "新選項2"]
    }
  ]
}
```

**回應**:
- 成功 (200):
```json
{
  "message": "回應更新成功"
}
```
- 錯誤 (403): 無權限編輯
- 錯誤 (404): 回應不存在

---

### 7. 刪除回應
**端點**: `DELETE /api/responses/:responseId`

**權限**: 需要登入 (表單擁有者)

**描述**: 刪除指定的回應 (僅管理員功能)

**回應**:
- 成功 (200):
```json
{
  "message": "回應刪除成功"
}
```
- 錯誤 (403): 無權限刪除
- 錯誤 (404): 回應不存在

---

## 資料驗證規則

### 提交回應時的驗證
1. **表單狀態驗證**
   - 表單必須是已發布狀態
   - 若設定開始/結束時間，需在有效期間內
   - 若設定回應數量上限，不能超過限制

2. **必填欄位驗證**
   - 所有標記為必填的題目都必須有答案
   - 答案不能為空值或空陣列

3. **題型特定驗證**
   - 單選題: 值必須是選項之一
   - 多選題: 值必須是選項陣列
   - 評分題: 值必須在有效範圍內
   - 數字題: 值必須符合設定的範圍
   - Email: 必須是有效的 Email 格式
   - 電話: 必須符合電話格式

---

## 錯誤碼說明

| HTTP 狀態碼 | 錯誤訊息 | 說明 |
|------------|---------|------|
| 400 | 表單尚未發布 | 嘗試提交未發布表單 |
| 400 | 表單尚未開始 | 在開始時間前提交 |
| 400 | 表單已結束 | 在結束時間後提交 |
| 400 | 已達回應數量上限 | 超過設定的回應數量限制 |
| 400 | 題目 X 為必填題 | 必填題目未填寫 |
| 401 | Access denied | 未提供或無效的 Token |
| 403 | 無權限查看 | 非表單擁有者嘗試查看回應 |
| 404 | 表單不存在 | 指定的表單 ID 不存在 |
| 404 | 回應不存在 | 指定的回應 ID 不存在 |

---

## 使用範例

### JavaScript (使用 Fetch API)

#### 提交表單回應 (匿名)
```javascript
const submitResponse = async () => {
  const response = await fetch('/api/forms/1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      answers: [
        { questionId: 1, value: "非常滿意" },
        { questionId: 2, value: ["功能A", "功能B"] },
        { questionId: 3, value: "這是一個很棒的服務" }
      ]
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('提交成功，回應 ID:', data.responseId);
  }
};
```

#### 獲取表單統計 (需要認證)
```javascript
const getStatistics = async (formId, token) => {
  const response = await fetch(`/api/forms/${formId}/statistics`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    const stats = await response.json();
    console.log('總回應數:', stats.overview.total_responses);
    console.log('平均完成時間:', stats.overview.avg_completion_time_minutes, '分鐘');
  }
};
```

#### 匯出 Excel 檔案
```javascript
const exportToExcel = async (formId, token) => {
  const response = await fetch(`/api/forms/${formId}/export?format=excel`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-${formId}-responses.xlsx`;
    a.click();
  }
};
```

---

## 注意事項

1. **匿名回應**: 提交回應時不需要登入，但如果有提供 Token，系統會記錄使用者資訊
2. **權限控制**: 只有表單擁有者可以查看、匯出、編輯或刪除回應
3. **資料隱私**: IP 位址和 User Agent 會自動記錄，用於防止重複提交和分析用途
4. **檔案大小**: Excel 匯出可能因資料量大而需要較長處理時間
5. **速率限制**: 建議實作速率限制以防止濫用

---

## 相關文檔

- [表單管理 API](./form-management-api.md)
- [認證與授權](./authentication.md)
- [資料庫架構](./database-er-diagram.md)