import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // 最大連線數
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 測試連線
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// 查詢方法
export const query = (text, params) => pool.query(text, params);

// 關閉連線池
export const closePool = () => pool.end();

export default pool;