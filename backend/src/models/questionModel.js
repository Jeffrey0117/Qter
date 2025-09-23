import { query } from '../config/database.js';

// 獲取表單的所有問題
export const getQuestionsByFormId = async (formId) => {
  const result = await query(`
    SELECT * FROM questions
    WHERE form_id = $1
    ORDER BY order_index ASC
  `, [formId]);

  return result.rows;
};

// 根據 ID 獲取單個問題
export const getQuestionById = async (questionId, formId) => {
  const result = await query(`
    SELECT * FROM questions
    WHERE id = $1 AND form_id = $2
  `, [questionId, formId]);

  return result.rows[0];
};

// 創建新問題
export const createQuestion = async (questionData) => {
  const { form_id, question_text, question_type, required, options, order_index } = questionData;

  const result = await query(`
    INSERT INTO questions (form_id, question_text, question_type, required, options, order_index)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [form_id, question_text, question_type, required || false, options || {}, order_index || 0]);

  return result.rows[0];
};

// 批量創建問題
export const createQuestions = async (questions) => {
  if (!questions || questions.length === 0) {
    return [];
  }

  const values = [];
  const params = [];
  let paramIndex = 1;

  questions.forEach((question, index) => {
    values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
    params.push(
      question.form_id,
      question.question_text,
      question.question_type,
      question.required || false,
      question.options || {},
      question.order_index || index
    );
    paramIndex += 6;
  });

  const sql = `
    INSERT INTO questions (form_id, question_text, question_type, required, options, order_index)
    VALUES ${values.join(', ')}
    RETURNING *
  `;

  const result = await query(sql, params);
  return result.rows;
};

// 更新問題
export const updateQuestion = async (questionId, questionData, formId) => {
  const { question_text, question_type, required, options, order_index } = questionData;

  let sql = 'UPDATE questions SET';
  const params = [];
  let paramIndex = 1;
  const updates = [];

  if (question_text !== undefined) {
    updates.push(` question_text = $${paramIndex}`);
    params.push(question_text);
    paramIndex++;
  }

  if (question_type !== undefined) {
    updates.push(` question_type = $${paramIndex}`);
    params.push(question_type);
    paramIndex++;
  }

  if (required !== undefined) {
    updates.push(` required = $${paramIndex}`);
    params.push(required);
    paramIndex++;
  }

  if (options !== undefined) {
    updates.push(` options = $${paramIndex}`);
    params.push(options);
    paramIndex++;
  }

  if (order_index !== undefined) {
    updates.push(` order_index = $${paramIndex}`);
    params.push(order_index);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  sql += updates.join(',');
  sql += ` WHERE id = $${paramIndex} AND form_id = $${paramIndex + 1} RETURNING *`;
  params.push(questionId, formId);

  const result = await query(sql, params);
  return result.rows[0];
};

// 刪除問題
export const deleteQuestion = async (questionId, formId) => {
  const result = await query(`
    DELETE FROM questions
    WHERE id = $1 AND form_id = $2
    RETURNING *
  `, [questionId, formId]);

  return result.rows[0];
};

// 重新排序問題
export const reorderQuestions = async (formId, questionOrders) => {
  // 使用事務確保數據一致性
  const client = await query('BEGIN');

  try {
    for (const { id, order_index } of questionOrders) {
      await query(`
        UPDATE questions
        SET order_index = $1
        WHERE id = $2 AND form_id = $3
      `, [order_index, id, formId]);
    }

    await query('COMMIT');
    return true;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

// 檢查問題是否存在且屬於指定表單
export const questionExists = async (questionId, formId) => {
  const result = await query(`
    SELECT id FROM questions
    WHERE id = $1 AND form_id = $2
  `, [questionId, formId]);

  return result.rows.length > 0;
};

// 獲取表單的問題數量
export const getQuestionCount = async (formId) => {
  const result = await query(`
    SELECT COUNT(*) as count FROM questions WHERE form_id = $1
  `, [formId]);

  return parseInt(result.rows[0].count);
};