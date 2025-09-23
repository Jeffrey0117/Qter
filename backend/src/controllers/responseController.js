const pool = require('../config/database');
const XLSX = require('xlsx');
const { Parser } = require('json2csv');

// 提交表單回應
exports.submitResponse = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { formId, answers } = req.body;
    const respondentId = req.user?.id || null;
    
    await client.query('BEGIN');
    
    // 檢查表單是否存在且已發布
    const formResult = await client.query(
      `SELECT id, title, status, start_date, end_date, response_limit,
              (SELECT COUNT(*) FROM responses WHERE form_id = $1) as response_count
       FROM forms 
       WHERE id = $1`,
      [formId]
    );
    
    if (formResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '表單不存在' });
    }
    
    const form = formResult.rows[0];
    
    // 檢查表單狀態
    if (form.status !== 'published') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '表單尚未發布' });
    }
    
    // 檢查時間限制
    const now = new Date();
    if (form.start_date && new Date(form.start_date) > now) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '表單尚未開始' });
    }
    
    if (form.end_date && new Date(form.end_date) < now) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '表單已結束' });
    }
    
    // 檢查回應數量限制
    if (form.response_limit && form.response_count >= form.response_limit) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '已達回應數量上限' });
    }
    
    // 獲取表單題目
    const questionsResult = await client.query(
      `SELECT id, type, required, options, validation_rules
       FROM questions
       WHERE form_id = $1 AND deleted_at IS NULL
       ORDER BY order_index`,
      [formId]
    );
    
    const questions = questionsResult.rows;
    
    // 驗證必填題目
    for (const question of questions) {
      if (question.required) {
        const answer = answers.find(a => a.questionId === question.id);
        if (!answer || !answer.value || 
            (Array.isArray(answer.value) && answer.value.length === 0)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `題目 ${question.id} 為必填題` 
          });
        }
      }
    }
    
    // 創建回應記錄
    const responseResult = await client.query(
      `INSERT INTO responses (form_id, respondent_id, submitted_at, ip_address, user_agent)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING id`,
      [formId, respondentId, req.ip, req.get('user-agent')]
    );
    
    const responseId = responseResult.rows[0].id;
    
    // 創建答案記錄
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;
      
      let answerValue = answer.value;
      
      // 根據題目類型處理答案
      if (question.type === 'file_upload') {
        // 處理檔案上傳題型
        if (Array.isArray(answerValue)) {
          // answerValue 應該是檔案 ID 陣列
          for (const fileId of answerValue) {
            await client.query(
              `INSERT INTO response_files (response_id, question_id, file_id)
               VALUES ($1, $2, $3)`,
              [responseId, answer.questionId, fileId]
            );
          }
          // 在 answers 表中儲存檔案 ID 列表作為參考
          answerValue = JSON.stringify(answerValue);
        } else if (answerValue) {
          // 單個檔案 ID
          await client.query(
            `INSERT INTO response_files (response_id, question_id, file_id)
             VALUES ($1, $2, $3)`,
            [responseId, answer.questionId, answerValue]
          );
          answerValue = String(answerValue);
        }
      } else if (question.type === 'checkbox' && Array.isArray(answerValue)) {
        answerValue = JSON.stringify(answerValue);
      } else if (typeof answerValue === 'object') {
        answerValue = JSON.stringify(answerValue);
      } else {
        answerValue = String(answerValue);
      }
      
      await client.query(
        `INSERT INTO answers (response_id, question_id, answer_text)
         VALUES ($1, $2, $3)`,
        [responseId, answer.questionId, answerValue]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: '回應提交成功',
      responseId
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// 獲取表單回應列表
exports.getResponses = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      startDate, 
      endDate,
      sortBy = 'submitted_at',
      sortOrder = 'DESC' 
    } = req.query;
    
    // 檢查權限
    const formResult = await pool.query(
      'SELECT created_by FROM forms WHERE id = $1',
      [formId]
    );
    
    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: '表單不存在' });
    }
    
    if (formResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '無權限查看此表單回應' });
    }
    
    const offset = (page - 1) * limit;
    
    // 構建查詢條件
    let whereConditions = ['r.form_id = $1'];
    let queryParams = [formId];
    let paramCount = 1;
    
    if (startDate) {
      paramCount++;
      whereConditions.push(`r.submitted_at >= $${paramCount}`);
      queryParams.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      whereConditions.push(`r.submitted_at <= $${paramCount}`);
      queryParams.push(endDate);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // 獲取總數
    const countQuery = `
      SELECT COUNT(*) as total
      FROM responses r
      WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // 獲取回應列表
    queryParams.push(limit, offset);
    const listQuery = `
      SELECT 
        r.id,
        r.respondent_id,
        r.submitted_at,
        r.ip_address,
        u.username as respondent_name,
        u.email as respondent_email
      FROM responses r
      LEFT JOIN users u ON r.respondent_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const result = await pool.query(listQuery, queryParams);
    
    res.json({
      responses: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// 獲取單一回應詳情
exports.getResponseDetail = async (req, res, next) => {
  try {
    const { responseId } = req.params;
    
    // 獲取回應資訊
    const responseResult = await pool.query(
      `SELECT 
        r.id,
        r.form_id,
        r.respondent_id,
        r.submitted_at,
        r.ip_address,
        r.user_agent,
        u.username as respondent_name,
        u.email as respondent_email,
        f.title as form_title,
        f.created_by as form_owner
      FROM responses r
      LEFT JOIN users u ON r.respondent_id = u.id
      LEFT JOIN forms f ON r.form_id = f.id
      WHERE r.id = $1`,
      [responseId]
    );
    
    if (responseResult.rows.length === 0) {
      return res.status(404).json({ error: '回應不存在' });
    }
    
    const response = responseResult.rows[0];
    
    // 檢查權限
    if (response.form_owner !== req.user.id) {
      return res.status(403).json({ error: '無權限查看此回應' });
    }
    
    // 獲取答案
    const answersResult = await pool.query(
      `SELECT
        a.id,
        a.question_id,
        a.answer_text,
        q.title as question_title,
        q.type as question_type,
        q.order_index
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.response_id = $1
      ORDER BY q.order_index`,
      [responseId]
    );
    
    // 處理答案格式
    const answers = [];
    
    for (const answer of answersResult.rows) {
      let value = answer.answer_text;
      
      // 根據題型處理答案
      if (answer.question_type === 'file_upload') {
        // 獲取檔案資訊
        const filesResult = await pool.query(
          `SELECT
            uf.id,
            uf.file_name,
            uf.original_name,
            uf.file_size,
            uf.mime_type
          FROM response_files rf
          JOIN uploaded_files uf ON rf.file_id = uf.id
          WHERE rf.response_id = $1 AND rf.question_id = $2`,
          [responseId, answer.question_id]
        );
        
        value = filesResult.rows;
      } else if (answer.question_type === 'checkbox') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // 保持原值
        }
      }
      
      answers.push({
        id: answer.id,
        questionId: answer.question_id,
        questionTitle: answer.question_title,
        questionType: answer.question_type,
        value
      });
    }
    
    res.json({
      ...response,
      answers
    });
    
  } catch (error) {
    next(error);
  }
};

// 獲取表單統計資料
exports.getFormStatistics = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { startDate, endDate } = req.query;
    
    // 檢查權限
    const formResult = await pool.query(
      'SELECT created_by, title FROM forms WHERE id = $1',
      [formId]
    );
    
    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: '表單不存在' });
    }
    
    if (formResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '無權限查看統計資料' });
    }
    
    // 構建時間條件
    let dateCondition = '';
    let queryParams = [formId];
    
    if (startDate && endDate) {
      dateCondition = ' AND r.submitted_at BETWEEN $2 AND $3';
      queryParams.push(startDate, endDate);
    }
    
    // 基本統計
    const statsQuery = `
      SELECT 
        COUNT(*) as total_responses,
        COUNT(DISTINCT r.respondent_id) as unique_respondents,
        AVG(EXTRACT(EPOCH FROM (r.submitted_at - r.created_at)) / 60) as avg_completion_time_minutes,
        MIN(r.submitted_at) as first_response_at,
        MAX(r.submitted_at) as last_response_at
      FROM responses r
      WHERE r.form_id = $1${dateCondition}
    `;
    
    const statsResult = await pool.query(statsQuery, queryParams);
    
    // 各題統計
    const questionsQuery = `
      SELECT 
        q.id,
        q.title,
        q.type,
        q.required,
        q.options,
        q.order_index
      FROM questions q
      WHERE q.form_id = $1 AND q.deleted_at IS NULL
      ORDER BY q.order_index
    `;
    
    const questionsResult = await pool.query(questionsQuery, [formId]);
    
    // 計算每題的答案分佈
    const questionStats = [];
    
    for (const question of questionsResult.rows) {
      const answersQuery = `
        SELECT a.answer_text, COUNT(*) as count
        FROM answers a
        JOIN responses r ON a.response_id = r.id
        WHERE a.question_id = $1 AND r.form_id = $2${dateCondition.replace('$2', '$3').replace('$3', '$4')}
        GROUP BY a.answer_text
        ORDER BY count DESC
      `;
      
      const answersParams = [question.id, ...queryParams];
      const answersResult = await pool.query(answersQuery, answersParams);
      
      // 處理不同題型的統計
      let statistics = {};
      
      if (question.type === 'radio' || question.type === 'dropdown') {
        statistics.distribution = answersResult.rows.reduce((acc, row) => {
          acc[row.answer_text] = parseInt(row.count);
          return acc;
        }, {});
      } else if (question.type === 'checkbox') {
        // 解析多選答案
        const allSelections = {};
        answersResult.rows.forEach(row => {
          try {
            const selections = JSON.parse(row.answer_text);
            selections.forEach(selection => {
              allSelections[selection] = (allSelections[selection] || 0) + parseInt(row.count);
            });
          } catch (e) {
            allSelections[row.answer_text] = parseInt(row.count);
          }
        });
        statistics.distribution = allSelections;
      } else if (question.type === 'rating') {
        const ratings = answersResult.rows.map(row => ({
          rating: parseInt(row.answer_text),
          count: parseInt(row.count)
        }));
        
        const totalRatings = ratings.reduce((sum, r) => sum + r.count, 0);
        const sumRatings = ratings.reduce((sum, r) => sum + (r.rating * r.count), 0);
        
        statistics = {
          distribution: ratings.reduce((acc, r) => {
            acc[r.rating] = r.count;
            return acc;
          }, {}),
          average: totalRatings > 0 ? (sumRatings / totalRatings).toFixed(2) : 0
        };
      } else {
        // 文字題目：顯示回應數量
        statistics.responseCount = answersResult.rows.length;
        statistics.sampleAnswers = answersResult.rows.slice(0, 5).map(r => r.answer_text);
      }
      
      questionStats.push({
        questionId: question.id,
        title: question.title,
        type: question.type,
        required: question.required,
        statistics
      });
    }
    
    // 時間趨勢統計（按日）
    const trendQuery = `
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as count
      FROM responses
      WHERE form_id = $1${dateCondition}
      GROUP BY DATE(submitted_at)
      ORDER BY date
    `;
    
    const trendResult = await pool.query(trendQuery, queryParams);
    
    res.json({
      formTitle: formResult.rows[0].title,
      overview: statsResult.rows[0],
      questionStatistics: questionStats,
      submissionTrend: trendResult.rows
    });
    
  } catch (error) {
    next(error);
  }
};

// 匯出表單回應 (CSV/Excel)
exports.exportResponses = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { format = 'csv', startDate, endDate } = req.query;
    
    // 檢查權限
    const formResult = await pool.query(
      'SELECT created_by, title FROM forms WHERE id = $1',
      [formId]
    );
    
    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: '表單不存在' });
    }
    
    if (formResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '無權限匯出回應' });
    }
    
    const formTitle = formResult.rows[0].title;
    
    // 構建查詢條件
    let dateCondition = '';
    let queryParams = [formId];
    
    if (startDate && endDate) {
      dateCondition = ' AND r.submitted_at BETWEEN $2 AND $3';
      queryParams.push(startDate, endDate);
    }
    
    // 獲取所有題目
    const questionsResult = await pool.query(
      `SELECT id, title, type, order_index
       FROM questions
       WHERE form_id = $1 AND deleted_at IS NULL
       ORDER BY order_index`,
      [formId]
    );
    
    const questions = questionsResult.rows;
    
    // 獲取所有回應和答案
    const dataQuery = `
      SELECT 
        r.id as response_id,
        r.submitted_at,
        r.respondent_id,
        u.username as respondent_name,
        u.email as respondent_email,
        r.ip_address,
        a.question_id,
        a.answer_text
      FROM responses r
      LEFT JOIN users u ON r.respondent_id = u.id
      LEFT JOIN answers a ON r.id = a.response_id
      WHERE r.form_id = $1${dateCondition}
      ORDER BY r.submitted_at DESC, a.question_id
    `;
    
    const dataResult = await pool.query(dataQuery, queryParams);
    
    // 整理資料為表格格式
    const responsesMap = {};
    
    dataResult.rows.forEach(row => {
      if (!responsesMap[row.response_id]) {
        responsesMap[row.response_id] = {
          '回應編號': row.response_id,
          '提交時間': new Date(row.submitted_at).toLocaleString('zh-TW'),
          '填寫者名稱': row.respondent_name || '匿名',
          '填寫者信箱': row.respondent_email || '',
          'IP 位址': row.ip_address
        };
        
        // 初始化所有題目欄位
        questions.forEach(q => {
          responsesMap[row.response_id][`Q${q.order_index + 1}. ${q.title}`] = '';
        });
      }
      
      // 填入答案
      if (row.question_id) {
        const question = questions.find(q => q.id === row.question_id);
        if (question) {
          let answer = row.answer_text;
          
          // 處理多選題和檔案上傳題答案
          if (question.type === 'checkbox') {
            try {
              answer = JSON.parse(answer).join(', ');
            } catch (e) {
              // 保持原值
            }
          } else if (question.type === 'file_upload') {
            // 獲取檔案名稱列表
            const filesResult = await pool.query(
              `SELECT uf.original_name
               FROM response_files rf
               JOIN uploaded_files uf ON rf.file_id = uf.id
               WHERE rf.response_id = $1 AND rf.question_id = $2`,
              [row.response_id, row.question_id]
            );
            
            answer = filesResult.rows.map(f => f.original_name).join(', ');
          }
          
          responsesMap[row.response_id][`Q${question.order_index + 1}. ${question.title}`] = answer;
        }
      }
    });
    
    const exportData = Object.values(responsesMap);
    
    if (format === 'excel' || format === 'xlsx') {
      // 匯出 Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '表單回應');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${formTitle}-responses-${Date.now()}.xlsx"`);
      res.send(buffer);
      
    } else {
      // 匯出 CSV
      if (exportData.length === 0) {
        return res.status(404).json({ error: '沒有回應資料可匯出' });
      }
      
      const fields = Object.keys(exportData[0]);
      const json2csvParser = new Parser({ fields, withBOM: true });
      const csv = json2csvParser.parse(exportData);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${formTitle}-responses-${Date.now()}.csv"`);
      res.send(csv);
    }
    
  } catch (error) {
    next(error);
  }
};

// 編輯回應（僅管理員）
exports.updateResponse = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { responseId } = req.params;
    const { answers } = req.body;
    
    // 檢查回應是否存在
    const responseResult = await client.query(
      `SELECT r.*, f.created_by as form_owner
       FROM responses r
       JOIN forms f ON r.form_id = f.id
       WHERE r.id = $1`,
      [responseId]
    );
    
    if (responseResult.rows.length === 0) {
      return res.status(404).json({ error: '回應不存在' });
    }
    
    const response = responseResult.rows[0];
    
    // 檢查權限（只有表單擁有者可以編輯）
    if (response.form_owner !== req.user.id) {
      return res.status(403).json({ error: '無權限編輯此回應' });
    }
    
    await client.query('BEGIN');
    
    // 更新答案
    for (const answer of answers) {
      let answerValue = answer.value;
      
      if (typeof answerValue === 'object') {
        answerValue = JSON.stringify(answerValue);
      } else {
        answerValue = String(answerValue);
      }
      
      await client.query(
        `UPDATE answers
         SET answer_text = $1, updated_at = NOW()
         WHERE response_id = $2 AND question_id = $3`,
        [answerValue, responseId, answer.questionId]
      );
    }
    
    // 記錄編輯時間
    await client.query(
      `UPDATE responses
       SET updated_at = NOW(), updated_by = $1
       WHERE id = $2`,
      [req.user.id, responseId]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: '回應更新成功' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// 刪除回應（僅管理員）
exports.deleteResponse = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { responseId } = req.params;
    
    // 檢查回應是否存在
    const responseResult = await client.query(
      `SELECT r.*, f.created_by as form_owner
       FROM responses r
       JOIN forms f ON r.form_id = f.id
       WHERE r.id = $1`,
      [responseId]
    );
    
    if (responseResult.rows.length === 0) {
      return res.status(404).json({ error: '回應不存在' });
    }
    
    const response = responseResult.rows[0];
    
    // 檢查權限
    if (response.form_owner !== req.user.id) {
      return res.status(403).json({ error: '無權限刪除此回應' });
    }
    
    await client.query('BEGIN');
    
    // 刪除相關答案
    await client.query(
      'DELETE FROM answers WHERE response_id = $1',
      [responseId]
    );
    
    // 刪除回應
    await client.query(
      'DELETE FROM responses WHERE id = $1',
      [responseId]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: '回應刪除成功' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = exports;