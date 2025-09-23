const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { 
  minioClient, 
  BUCKET_NAME, 
  generatePresignedUrl,
  generateUploadUrl,
  getPublicUrl,
  fileExists,
  getFileInfo
} = require('../config/minio');
const db = require('../config/database');

// 檔案類型驗證
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

// 檔案大小限制（10MB）
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Multer 記憶體存儲配置
const storage = multer.memoryStorage();

// Multer 配置
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // 檢查檔案類型
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支援的檔案類型: ${file.mimetype}`));
    }
  }
});

// 圖片壓縮處理
const compressImage = async (buffer, mimetype) => {
  try {
    let pipeline = sharp(buffer);
    
    // 根據檔案類型設定壓縮參數
    switch (mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
        break;
      case 'image/png':
        pipeline = pipeline.png({ compressionLevel: 8, progressive: true });
        break;
      case 'image/webp':
        pipeline = pipeline.webp({ quality: 85 });
        break;
      case 'image/gif':
        // GIF 檔案保持原樣
        return buffer;
      default:
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
    }
    
    // 限制最大寬度為 1920px，保持長寬比
    pipeline = pipeline.resize(1920, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
    
    return await pipeline.toBuffer();
  } catch (error) {
    console.error('圖片壓縮失敗:', error);
    // 如果壓縮失敗，返回原始 buffer
    return buffer;
  }
};

// 生成唯一的檔案名稱
const generateFileName = (originalName, userId) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  return `${userId || 'anonymous'}/${timestamp}-${uuid}${ext}`;
};

// 上傳單個檔案
const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '請選擇要上傳的檔案'
      });
    }

    const { file } = req;
    const userId = req.user?.id;
    
    // 生成檔案名稱
    const fileName = generateFileName(file.originalname, userId);
    
    // 處理檔案 buffer
    let fileBuffer = file.buffer;
    
    // 如果是圖片，進行壓縮
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      fileBuffer = await compressImage(fileBuffer, file.mimetype);
    }
    
    // 上傳到 MinIO
    const metaData = {
      'Content-Type': file.mimetype,
      'Original-Name': file.originalname,
      'User-Id': userId || 'anonymous',
      'Upload-Date': new Date().toISOString()
    };
    
    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      fileBuffer,
      fileBuffer.length,
      metaData
    );
    
    // 記錄到資料庫
    const [fileRecord] = await db.query(
      `INSERT INTO uploaded_files 
       (user_id, file_name, original_name, file_size, mime_type, storage_path) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, fileName, file.originalname, fileBuffer.length, file.mimetype, fileName]
    );
    
    // 生成檔案 URL
    const fileUrl = userId 
      ? await generatePresignedUrl(fileName, 7 * 24 * 60 * 60) // 7 天有效期
      : getPublicUrl(`public/${fileName}`);
    
    res.status(200).json({
      status: 'success',
      data: {
        id: fileRecord.insertId,
        fileName: fileName,
        originalName: file.originalname,
        size: fileBuffer.length,
        mimeType: file.mimetype,
        url: fileUrl,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('檔案上傳失敗:', error);
    res.status(500).json({
      status: 'error',
      message: '檔案上傳失敗',
      error: error.message
    });
  }
};

// 上傳多個檔案
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '請選擇要上傳的檔案'
      });
    }

    const userId = req.user?.id;
    const uploadedFiles = [];
    const errors = [];
    
    // 處理每個檔案
    for (const file of req.files) {
      try {
        // 生成檔案名稱
        const fileName = generateFileName(file.originalname, userId);
        
        // 處理檔案 buffer
        let fileBuffer = file.buffer;
        
        // 如果是圖片，進行壓縮
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          fileBuffer = await compressImage(fileBuffer, file.mimetype);
        }
        
        // 上傳到 MinIO
        const metaData = {
          'Content-Type': file.mimetype,
          'Original-Name': file.originalname,
          'User-Id': userId || 'anonymous',
          'Upload-Date': new Date().toISOString()
        };
        
        await minioClient.putObject(
          BUCKET_NAME,
          fileName,
          fileBuffer,
          fileBuffer.length,
          metaData
        );
        
        // 記錄到資料庫
        const [fileRecord] = await db.query(
          `INSERT INTO uploaded_files 
           (user_id, file_name, original_name, file_size, mime_type, storage_path) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, fileName, file.originalname, fileBuffer.length, file.mimetype, fileName]
        );
        
        // 生成檔案 URL
        const fileUrl = userId 
          ? await generatePresignedUrl(fileName, 7 * 24 * 60 * 60)
          : getPublicUrl(`public/${fileName}`);
        
        uploadedFiles.push({
          id: fileRecord.insertId,
          fileName: fileName,
          originalName: file.originalname,
          size: fileBuffer.length,
          mimeType: file.mimetype,
          url: fileUrl,
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        uploaded: uploadedFiles,
        failed: errors
      }
    });
  } catch (error) {
    console.error('多檔案上傳失敗:', error);
    res.status(500).json({
      status: 'error',
      message: '檔案上傳失敗',
      error: error.message
    });
  }
};

// 刪除檔案
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;
    
    // 查詢檔案資訊
    const [files] = await db.query(
      'SELECT * FROM uploaded_files WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [fileId, userId]
    );
    
    if (files.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '檔案不存在或無權限刪除'
      });
    }
    
    const file = files[0];
    
    // 從 MinIO 刪除檔案
    await minioClient.removeObject(BUCKET_NAME, file.storage_path);
    
    // 從資料庫刪除記錄
    await db.query('DELETE FROM uploaded_files WHERE id = ?', [fileId]);
    
    res.status(200).json({
      status: 'success',
      message: '檔案刪除成功'
    });
  } catch (error) {
    console.error('檔案刪除失敗:', error);
    res.status(500).json({
      status: 'error',
      message: '檔案刪除失敗',
      error: error.message
    });
  }
};

// 批量刪除檔案
const deleteMultipleFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;
    const userId = req.user?.id;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '請提供要刪除的檔案 ID 列表'
      });
    }
    
    const deletedFiles = [];
    const errors = [];
    
    for (const fileId of fileIds) {
      try {
        // 查詢檔案資訊
        const [files] = await db.query(
          'SELECT * FROM uploaded_files WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
          [fileId, userId]
        );
        
        if (files.length === 0) {
          errors.push({
            fileId,
            error: '檔案不存在或無權限刪除'
          });
          continue;
        }
        
        const file = files[0];
        
        // 從 MinIO 刪除檔案
        await minioClient.removeObject(BUCKET_NAME, file.storage_path);
        
        // 從資料庫刪除記錄
        await db.query('DELETE FROM uploaded_files WHERE id = ?', [fileId]);
        
        deletedFiles.push(fileId);
      } catch (error) {
        errors.push({
          fileId,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        deleted: deletedFiles,
        failed: errors
      }
    });
  } catch (error) {
    console.error('批量刪除檔案失敗:', error);
    res.status(500).json({
      status: 'error',
      message: '批量刪除檔案失敗',
      error: error.message
    });
  }
};

// 獲取檔案資訊
const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;
    
    // 查詢檔案資訊
    const [files] = await db.query(
      'SELECT * FROM uploaded_files WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [fileId, userId]
    );
    
    if (files.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '檔案不存在或無權限查看'
      });
    }
    
    const file = files[0];
    
    // 生成檔案 URL
    const fileUrl = file.user_id 
      ? await generatePresignedUrl(file.storage_path, 7 * 24 * 60 * 60)
      : getPublicUrl(file.storage_path);
    
    res.status(200).json({
      status: 'success',
      data: {
        id: file.id,
        fileName: file.file_name,
        originalName: file.original_name,
        size: file.file_size,
        mimeType: file.mime_type,
        url: fileUrl,
        uploadedAt: file.created_at
      }
    });
  } catch (error) {
    console.error('獲取檔案資訊失敗:', error);
    res.status(500).json({
      status: 'error',
      message: '獲取檔案資訊失敗',
      error: error.message
    });
  }
};

// 生成預簽名上傳 URL
const getUploadUrl = async (req, res) => {
  try {
    const { fileName } = req.body;
    const userId = req.user?.id;
    
    if (!fileName) {
      return res.status(400).json({
        status: 'error',
        message: '請提供檔案名稱'
      });
    }
    
    // 生成唯一檔案名稱
    const uniqueFileName = generateFileName(fileName, userId);
    
    // 生成預簽名上傳 URL（1 小時有效）
    const uploadUrl = await generateUploadUrl(uniqueFileName, 60 * 60);
    
    res.status(200).json({
      status: 'success',
      data: {
        uploadUrl,
        fileName: uniqueFileName,
        expiresIn: 3600 // 秒
      }
    });
  } catch (error) {
    console.error('生成上傳 URL 失敗:', error);
    res.status(500).json({
      status: 'error',
      message: '生成上傳 URL 失敗',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getFileInfo,
  getUploadUrl
};