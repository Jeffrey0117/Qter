import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// 生成 JWT access token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

// 生成 JWT refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// 創建 access token 回應
const createTokenResponse = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  // 計算 refresh token 到期時間 (30 天)
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 將 refresh token 存儲到資料庫
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // 先刪除該用戶的所有舊 refresh tokens
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

  // 插入新的 refresh token
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, refreshTokenExpiresAt]
  );

  // 移除密碼欄位
  const { password_hash, ...userWithoutPassword } = user;

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: {
      user: userWithoutPassword,
    },
  });
};

// @desc    註冊新使用者
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // 驗證輸入
  if (!username || !email || !password) {
    return next(new AppError('Please provide username, email and password', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400));
  }

  // 檢查使用者是否已存在
  const existingUser = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);

  if (existingUser.rows.length > 0) {
    return next(new AppError('User with this email or username already exists', 400));
  }

  // 加密密碼
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // 創建使用者
  const result = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
    [username, email, password_hash]
  );

  await createTokenResponse(result.rows[0], 201, res);
});

// @desc    使用者登入
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 驗證輸入
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 檢查使用者是否存在
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    return next(new AppError('Invalid credentials', 401));
  }

  const user = result.rows[0];

  // 驗證密碼
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return next(new AppError('Invalid credentials', 401));
  }

  await createTokenResponse(user, 200, res);
});

// @desc    刷新 access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  // 計算 refresh token 的 hash
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // 查找有效的 refresh token
  const result = await query(
    'SELECT rt.user_id, u.username, u.email, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token_hash = $1 AND rt.expires_at > CURRENT_TIMESTAMP AND rt.revoked = FALSE',
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const user = result.rows[0];

  // 生成新的 access token
  const newAccessToken = generateAccessToken(user.user_id);

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
  });
});

// @desc    使用者登出
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // 撤銷 refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
  }

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

// @desc    獲取當前使用者資訊
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const result = await query(
    'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: result.rows[0],
    },
  });
});

// @desc    更新使用者密碼
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current password and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }

  // 獲取使用者當前密碼
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];

  // 驗證當前密碼
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // 加密新密碼
  const salt = await bcrypt.genSalt(12);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);

  // 更新密碼
  await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, req.user.id]);

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully',
  });
});