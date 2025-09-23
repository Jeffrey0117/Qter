const Minio = require('minio');

// MinIO 客戶端配置
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// 預設的儲存桶名稱
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'qter-uploads';

// 初始化 MinIO 儲存桶
const initMinio = async () => {
  try {
    // 檢查儲存桶是否存在
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      // 創建儲存桶
      await minioClient.makeBucket(BUCKET_NAME, process.env.MINIO_REGION || 'us-east-1');
      console.log(`MinIO bucket '${BUCKET_NAME}' created successfully`);
      
      // 設置儲存桶策略為公開讀取（可選）
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/public/*`]
          }
        ]
      };
      
      // 設置儲存桶策略
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`Public access policy set for '${BUCKET_NAME}/public/*'`);
    } else {
      console.log(`MinIO bucket '${BUCKET_NAME}' already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing MinIO:', error);
    throw error;
  }
};

// 生成預簽名 URL（用於私有檔案）
const generatePresignedUrl = async (objectName, expiry = 7 * 24 * 60 * 60) => {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, expiry);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

// 生成上傳用的預簽名 URL
const generateUploadUrl = async (objectName, expiry = 60 * 60) => {
  try {
    const url = await minioClient.presignedPutObject(BUCKET_NAME, objectName, expiry);
    return url;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
};

// 獲取公開 URL（僅限於 public 資料夾下的檔案）
const getPublicUrl = (objectName) => {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || 9000;
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  
  return `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;
};

// 檢查檔案是否存在
const fileExists = async (objectName) => {
  try {
    await minioClient.statObject(BUCKET_NAME, objectName);
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

// 獲取檔案資訊
const getFileInfo = async (objectName) => {
  try {
    const stat = await minioClient.statObject(BUCKET_NAME, objectName);
    return {
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      metaData: stat.metaData
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
};

module.exports = {
  minioClient,
  BUCKET_NAME,
  initMinio,
  generatePresignedUrl,
  generateUploadUrl,
  getPublicUrl,
  fileExists,
  getFileInfo
};