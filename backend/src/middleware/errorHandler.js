import { query } from '../config/database.js';

// 自訂錯誤類別
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// 全域錯誤處理中間件
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 記錄錯誤
  console.error('Error:', err);

  // PostgreSQL 錯誤
  if (err.code === '23505') {
    // 重複鍵值錯誤
    const field = err.constraint?.includes('email') ? 'email' : 'field';
    return res.status(400).json({
      status: 'error',
      message: `${field} already exists`,
    });
  }

  if (err.code === '23503') {
    // 外鍵約束錯誤
    return res.status(400).json({
      status: 'error',
      message: 'Invalid reference',
    });
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
    });
  }

  // 預設錯誤回應
  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    message: error.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 處理中間件
export const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// 非同步錯誤處理包裝器
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);