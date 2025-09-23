const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const pool = require('./config/database');
const { initMinio } = require('./config/minio');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 測試資料庫連線
const testDatabaseConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// 初始化 MinIO
const initializeMinIO = async () => {
  try {
    await initMinio();
    console.log('✅ MinIO initialized successfully');
  } catch (error) {
    console.error('❌ MinIO initialization failed:', error.message);
    // MinIO 初始化失敗不影響服務啟動，但記錄錯誤
  }
};

// 中間件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 基本路由
app.get('/', (req, res) => {
  res.json({
    message: '互動式客製化表單系統 API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV
  });
});

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// API 路由
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const responseRoutes = require('./routes/responseRoutes');
const fileRoutes = require('./routes/fileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', formRoutes);
app.use('/api', responseRoutes);
app.use('/api/files', fileRoutes);

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 錯誤處理中間件
app.use(errorHandler);

// 啟動伺服器
const startServer = async () => {
  await testDatabaseConnection();
  await initializeMinIO();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch(console.error);

module.exports = app;