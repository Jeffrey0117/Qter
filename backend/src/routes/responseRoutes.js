const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// 提交表單回應（可選驗證，支援匿名回應）
router.post('/forms/:formId/responses', optionalAuth, responseController.submitResponse);

// 獲取表單回應列表（需要驗證）
router.get('/forms/:formId/responses', authenticateToken, responseController.getResponses);

// 獲取單一回應詳情（需要驗證）
router.get('/responses/:responseId', authenticateToken, responseController.getResponseDetail);

// 獲取表單統計資料（需要驗證）
router.get('/forms/:formId/statistics', authenticateToken, responseController.getFormStatistics);

// 匯出表單回應（需要驗證）
router.get('/forms/:formId/export', authenticateToken, responseController.exportResponses);

// 編輯回應（需要驗證，僅管理員）
router.put('/responses/:responseId', authenticateToken, responseController.updateResponse);

// 刪除回應（需要驗證，僅管理員）
router.delete('/responses/:responseId', authenticateToken, responseController.deleteResponse);

module.exports = router;