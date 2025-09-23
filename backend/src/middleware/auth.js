const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// 驗證 JWT token
const authenticateToken = async (req, res, next) => {
  try {
    let token;

    // 檢查 Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 驗證 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 獲取使用者資訊
    const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Token is not valid. User not found.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token is not valid.' });
  }
};

// 授權角色檢查
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to access this resource' });
    }

    next();
  };
};

// 可選認證 (允許匿名訪問)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [decoded.id]);

        if (result.rows.length > 0) {
          req.user = result.rows[0];
        }
      } catch (error) {
        // 忽略 token 驗證錯誤，繼續匿名訪問
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth
};