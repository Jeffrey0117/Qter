# 檔案管理 API 文檔

## 概述
檔案管理 API 提供檔案上傳、下載、刪除等功能，整合 MinIO 物件儲存服務，支援圖片壓縮和多檔案上傳。

## 基礎路徑
```
/api/files
```

## 認證
大部分 API 需要 JWT 認證，部分支援匿名使用（使用 optionalAuth）。

---

## 檔案上傳 API

### 1. 上傳單個檔案
**端點：** `POST /api/files/upload`  
**認證：** optionalAuth（可選）  
**Content-Type：** `multipart/form-data`

**請求 Body（FormData）：**
```javascript
{
  file: File // 檔案物件
}
```

**支援的檔案類型：**
- 圖片：`image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- 文件：`application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- 試算表：`application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**檔案大小限制：** 10MB

**回應：**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "fileName": "user123/1234567890-abcd1234.jpg",
    "originalName": "photo.jpg",
    "size": 102400,
    "mimeType": "image/jpeg",
    "url": "https://minio.example.com/qter-uploads/...",
    "uploadedAt": "2025-09-23T08:00:00.000Z"
  }
}
```

**錯誤回應：**
```json
{
  "status": "error",
  "message": "不支援的檔案類型: text/plain"
}
```

### 2. 上傳多個檔案
**端點：** `POST /api/files/upload-multiple`  
**認證：** optionalAuth（可選）  
**Content-Type：** `multipart/form-data`

**請求 Body（FormData）：**
```javascript
{
  files: File[] // 檔案陣列，最多 10 個
}
```

**回應：**
```json
{
  "status": "success",
  "data": {
    "uploaded": [
      {
        "id": 1,
        "fileName": "user123/1234567890-abcd1234.jpg",
        "originalName": "photo1.jpg",
        "size": 102400,
        "mimeType": "image/jpeg",
        "url": "https://minio.example.com/...",
        "uploadedAt": "2025-09-23T08:00:00.000Z"
      },
      {
        "id": 2,
        "fileName": "user123/1234567891-efgh5678.png",
        "originalName": "photo2.png",
        "size": 204800,
        "mimeType": "image/png",
        "url": "https://minio.example.com/...",
        "uploadedAt": "2025-09-23T08:00:01.000Z"
      }
    ],
    "failed": [
      {
        "fileName": "large-file.zip",
        "error": "檔案大小超過限制"
      }
    ]
  }
}
```

---

## 檔案刪除 API

### 3. 刪除單個檔案
**端點：** `DELETE /api/files/:fileId`  
**認證：** 必需  
**權限：** 只能刪除自己上傳的檔案

**參數：**
- `fileId` (path): 檔案 ID

**回應：**
```json
{
  "status": "success",
  "message": "檔案刪除成功"
}
```

**錯誤回應：**
```json
{
  "status": "error",
  "message": "檔案不存在或無權限刪除"
}
```

### 4. 批量刪除檔案
**端點：** `DELETE /api/files/batch-delete`  
**認證：** 必需  
**權限：** 只能刪除自己上傳的檔案

**請求 Body：**
```json
{
  "fileIds": [1, 2, 3]
}
```

**回應：**
```json
{
  "status": "success",
  "data": {
    "deleted": [1, 2],
    "failed": [
      {
        "fileId": 3,
        "error": "檔案不存在或無權限刪除"
      }
    ]
  }
}
```

---

## 檔案資訊 API

### 5. 獲取檔案資訊
**端點：** `GET /api/files/:fileId`  
**認證：** optionalAuth（可選）  
**權限：** 只能查看自己上傳或公開的檔案

**參數：**
- `fileId` (path): 檔案 ID

**回應：**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "fileName": "user123/1234567890-abcd1234.jpg",
    "originalName": "photo.jpg",
    "size": 102400,
    "mimeType": "image/jpeg",
    "url": "https://minio.example.com/...",
    "uploadedAt": "2025-09-23T08:00:00.000Z"
  }
}
```

### 6. 生成預簽名上傳 URL
**端點：** `POST /api/files/generate-upload-url`  
**認證：** optionalAuth（可選）  
**說明：** 生成直接上傳到 MinIO 的預簽名 URL，用於客戶端直接上傳大檔案

**請求 Body：**
```json
{
  "fileName": "document.pdf"
}
```

**回應：**
```json
{
  "status": "success",
  "data": {
    "uploadUrl": "https://minio.example.com/qter-uploads/...",
    "fileName": "user123/1234567890-abcd1234.pdf",
    "expiresIn": 3600
  }
}
```

---

## 圖片處理功能

### 圖片壓縮
上傳圖片時會自動進行壓縮處理：
- **JPEG/JPG：** 品質壓縮至 85%，啟用漸進式載入
- **PNG：** 壓縮等級 8，啟用漸進式載入
- **WebP：** 品質壓縮至 85%
- **GIF：** 保持原始格式不壓縮
- **尺寸限制：** 最大寬度 1920px，保持長寬比

### 支援的圖片格式
- JPEG/JPG
- PNG
- WebP
- GIF

---

## 與表單系統整合

### file_upload 題型支援
在表單回應中，`file_upload` 題型的答案會包含檔案 ID，系統會自動：
1. 在 `response_files` 表中建立關聯
2. 在查詢回應時返回完整的檔案資訊
3. 在匯出資料時顯示檔案名稱

### 提交表單回應範例
```json
{
  "formId": 1,
  "answers": [
    {
      "questionId": 5,
      "value": [1, 2]  // file_upload 題型，值為檔案 ID 陣列
    }
  ]
}
```

### 回應詳情中的檔案資訊
```json
{
  "id": 1,
  "questionId": 5,
  "questionTitle": "請上傳相關文件",
  "questionType": "file_upload",
  "value": [
    {
      "id": 1,
      "file_name": "user123/1234567890-abcd1234.pdf",
      "original_name": "合約書.pdf",
      "file_size": 512000,
      "mime_type": "application/pdf"
    }
  ]
}
```

---

## 錯誤碼說明

| 錯誤碼 | 說明 |
|-------|------|
| 400 | 請求參數錯誤或檔案類型不支援 |
| 401 | 未認證 |
| 403 | 無權限操作 |
| 404 | 檔案不存在 |
| 413 | 檔案大小超過限制 |
| 500 | 伺服器內部錯誤 |

---

## 使用範例

### JavaScript (使用 Fetch API)

#### 上傳單個檔案
```javascript
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}` // 如果需要認證
    },
    body: formData
  });
  
  return await response.json();
};
```

#### 上傳多個檔案
```javascript
const uploadMultipleFiles = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch('/api/files/upload-multiple', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};
```

#### 刪除檔案
```javascript
const deleteFile = async (fileId) => {
  const response = await fetch(`/api/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

---

## 注意事項

1. **檔案大小限制：** 單個檔案最大 10MB
2. **批次上傳限制：** 一次最多上傳 10 個檔案
3. **圖片自動壓縮：** 上傳的圖片會自動進行壓縮處理
4. **檔案存取權限：** 
   - 已登入用戶的檔案會生成有時效的預簽名 URL（7天）
   - 匿名上傳的檔案會儲存在 public 資料夾，可公開存取
5. **MinIO 配置：** 需要正確配置 MinIO 服務的連線資訊
6. **檔案命名：** 系統會自動生成唯一的檔案名稱，格式為 `userId/timestamp-uuid.ext`

---

## 環境變數配置

```env
# MinIO 設定
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=qter-uploads
MINIO_USE_SSL=false
MINIO_REGION=us-east-1