const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const {
  upload,
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getFileInfo,
  getUploadUrl
} = require('../controllers/fileController');

// ===== 檔案上傳 API =====

// 上傳單個檔案
// POST /api/files/upload
router.post('/upload', 
  optionalAuth, 
  upload.single('file'), 
  uploadSingleFile
);

// 上傳多個檔案（最多10個）
// POST /api/files/upload-multiple
router.post('/upload-multiple', 
  optionalAuth, 
  upload.array('files', 10), 
  uploadMultipleFiles
);

// ===== 檔案刪除 API =====

// 刪除單個檔案
// DELETE /api/files/:fileId
router.delete('/:fileId', 
  auth, 
  deleteFile
);

// 批量刪除檔案
// DELETE /api/files/batch-delete
router.delete('/batch-delete', 
  auth, 
  deleteMultipleFiles
);

// ===== 檔案資訊 API =====

// 獲取檔案資訊
// GET /api/files/:fileId
router.get('/:fileId', 
  optionalAuth, 
  getFileInfo
);

// 生成預簽名上傳 URL（用於客戶端直接上傳）
// POST /api/files/generate-upload-url
router.post('/generate-upload-url', 
  optionalAuth, 
  getUploadUrl
);

module.exports = router;