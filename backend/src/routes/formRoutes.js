import express from 'express';
import {
  getUserForms,
  getForm,
  createNewForm,
  updateExistingForm,
  deleteExistingForm,
  duplicateExistingForm,
  togglePublishForm,
  getPublicFormData
} from '../controllers/formController.js';
import {
  getFormQuestions,
  getQuestion,
  createNewQuestion,
  createQuestionsBatch,
  updateExistingQuestion,
  deleteExistingQuestion,
  reorderFormQuestions
} from '../controllers/questionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要認證
router.use(authenticate);

// 表單 CRUD 路由
router.route('/')
  .get(getUserForms)
  .post(createNewForm);

router.route('/:id')
  .get(getForm)
  .put(updateExistingForm)
  .delete(deleteExistingForm);

router.post('/:id/duplicate', duplicateExistingForm);
router.patch('/:id/publish', togglePublishForm);

// 問題管理路由
router.route('/:formId/questions')
  .get(getFormQuestions)
  .post(createNewQuestion);

router.post('/:formId/questions/batch', createQuestionsBatch);

router.route('/:formId/questions/:questionId')
  .get(getQuestion)
  .put(updateExistingQuestion)
  .delete(deleteExistingQuestion);

router.patch('/:formId/questions/reorder', reorderFormQuestions);

// 公開路由（不需要認證，用於表單填寫）
router.get('/public/:id', getPublicFormData);

export default router;