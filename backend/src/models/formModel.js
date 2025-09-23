import { query } from '../config/database.js';

// 獲取所有表單（根據使用者）
export const getForms = async (userId, filters = {}) => {
  let sql = `
    SELECT f.*,
           json_agg(
             json_build_object(
               'id', q.id,
               'question_text', q.question_text,
               'question_type', q.question_type,
               'required', q.required,
               'options', q.options,
               'order_index', q.order_index
             ) ORDER BY q.order_index
           ) as questions
    FROM forms f
    LEFT JOIN questions q ON f.id = q.form_id
    WHERE f.creator_id = $1
  `;

  const params = [userId];
  let paramIndex = 2;

  // 添加篩選條件
  if (filters.published !== undefined) {
    sql += ` AND f.published = $${paramIndex}`;
    params.push(filters.published);
    paramIndex++;
  }

  if (filters.search) {
    sql += ` AND (f.title ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  sql += `
    GROUP BY f.id
    ORDER BY f.updated_at DESC
  `;

  // 添加分頁
  if (filters.limit) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset) {
    sql += ` OFFSET $${paramIndex}`;
    params.push(filters.offset);
  }

  // 獲取總數量
  let countSql = `
    SELECT COUNT(*) as total
    FROM forms f
    WHERE f.creator_id = $1
  `;

  const countParams = [userId];
  let countParamIndex = 2;

  // 添加篩選條件到 COUNT 查詢
  if (filters.published !== undefined) {
    countSql += ` AND f.published = $${countParamIndex}`;
    countParams.push(filters.published);
    countParamIndex++;
  }

  if (filters.search) {
    countSql += ` AND (f.title ILIKE $${countParamIndex} OR f.description ILIKE $${countParamIndex})`;
    countParams.push(`%${filters.search}%`);
  }

  const [formsResult, countResult] = await Promise.all([
    query(sql, params),
    query(countSql, countParams)
  ]);

  return {
    forms: formsResult.rows,
    total: parseInt(countResult.rows[0].total)
  };
};

// 根據 ID 獲取單個表單
export const getFormById = async (formId, userId) => {
  const result = await query(`
    SELECT f.*,
           json_agg(
             json_build_object(
               'id', q.id,
               'question_text', q.question_text,
               'question_type', q.question_type,
               'required', q.required,
               'options', q.options,
               'order_index', q.order_index
             ) ORDER BY q.order_index
           ) as questions
    FROM forms f
    LEFT JOIN questions q ON f.id = q.form_id
    WHERE f.id = $1 AND f.creator_id = $2
    GROUP BY f.id
  `, [formId, userId]);

  return result.rows[0];
};

// 創建新表單
export const createForm = async (formData, userId) => {
  const { title, description, settings } = formData;

  const result = await query(`
    INSERT INTO forms (title, description, settings, creator_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [title, description || '', settings || {}, userId]);

  return result.rows[0];
};

// 更新表單
export const updateForm = async (formId, formData, userId) => {
  const { title, description, settings, published } = formData;

  let sql = 'UPDATE forms SET updated_at = CURRENT_TIMESTAMP';
  const params = [];
  let paramIndex = 1;

  if (title !== undefined) {
    sql += `, title = $${paramIndex}`;
    params.push(title);
    paramIndex++;
  }

  if (description !== undefined) {
    sql += `, description = $${paramIndex}`;
    params.push(description);
    paramIndex++;
  }

  if (settings !== undefined) {
    sql += `, settings = $${paramIndex}`;
    params.push(settings);
    paramIndex++;
  }

  if (published !== undefined) {
    sql += `, published = $${paramIndex}`;
    params.push(published);
    paramIndex++;
  }

  sql += ` WHERE id = $${paramIndex} AND creator_id = $${paramIndex + 1} RETURNING *`;
  params.push(formId, userId);

  const result = await query(sql, params);
  return result.rows[0];
};

// 刪除表單
export const deleteForm = async (formId, userId) => {
  // 首先刪除所有相關的問題
  await query('DELETE FROM questions WHERE form_id = $1', [formId]);

  // 然後刪除表單
  const result = await query('DELETE FROM forms WHERE id = $1 AND creator_id = $2 RETURNING *', [formId, userId]);
  return result.rows[0];
};

// 複製表單
export const duplicateForm = async (formId, userId) => {
  // 獲取原始表單
  const originalForm = await getFormById(formId, userId);
  if (!originalForm) {
    throw new Error('Form not found');
  }

  // 創建新表單
  const newForm = await createForm({
    title: `${originalForm.title} (副本)`,
    description: originalForm.description,
    settings: originalForm.settings
  }, userId);

  // 複製問題
  if (originalForm.questions && originalForm.questions[0] !== null) {
    for (const question of originalForm.questions) {
      await query(`
        INSERT INTO questions (form_id, question_text, question_type, required, options, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        newForm.id,
        question.question_text,
        question.question_type,
        question.required,
        question.options,
        question.order_index
      ]);
    }
  }

  return getFormById(newForm.id, userId);
};

// 檢查表單是否存在且屬於使用者
export const formExists = async (formId, userId) => {
  const result = await query('SELECT id FROM forms WHERE id = $1 AND creator_id = $2', [formId, userId]);
  return result.rows.length > 0;
};

// 獲取公開表單（用於填寫）
export const getPublicForm = async (formId) => {
  const result = await query(`
    SELECT f.*,
           json_agg(
             json_build_object(
               'id', q.id,
               'question_text', q.question_text,
               'question_type', q.question_type,
               'required', q.required,
               'options', q.options,
               'order_index', q.order_index
             ) ORDER BY q.order_index
           ) as questions
    FROM forms f
    LEFT JOIN questions q ON f.id = q.form_id
    WHERE f.id = $1 AND f.published = true
    GROUP BY f.id
  `, [formId]);

  return result.rows[0];
};