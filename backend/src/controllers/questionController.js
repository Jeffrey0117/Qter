import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formExists } from '../models/formModel.js';
import {
  getQuestionsByFormId,
  getQuestionById,
  createQuestion,
  createQuestions,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  questionExists,
  getQuestionCount
} from '../models/questionModel.js';

// @desc    獲取表單的所有問題
// @route   GET /api/forms/:formId/questions
// @access  Private
export const getFormQuestions = asyncHandler(async (req, res, next) => {
  const formId = req.params.formId;
  const userId = req.user.id;

  // 檢查表單是否存在且屬於當前使用者
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  const questions = await getQuestionsByFormId(formId);

  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      questions
    }
  });
});

// @desc    獲取單個問題詳情
// @route   GET /api/forms/:formId/questions/:questionId
// @access  Private
export const getQuestion = asyncHandler(async (req, res, next) => {
  const { formId, questionId } = req.params;
  const userId = req.user.id;

  // 檢查表單是否存在且屬於當前使用者
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  const question = await getQuestionById(questionId, formId);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      question
    }
  });
});

// @desc    創建新問題
// @route   POST /api/forms/:formId/questions
// @access  Private
export const createNewQuestion = asyncHandler(async (req, res, next) => {
  const formId = req.params.formId;
  const userId = req.user.id;
  const { question_text, question_type, required, options } = req.body;

  // 驗證輸入
  if (!question_text || question_text.trim().length === 0) {
    return next(new AppError('Question text is required', 400));
  }

  if (!question_type || !['short_answer', 'long_answer', 'single_choice', 'multiple_choice', 'file_upload'].includes(question_type)) {
    return next(new AppError('Invalid question type', 400));
  }

  // 檢查表單是否存在且屬於當前使用者
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  // 獲取當前問題數量作為 order_index
  const questionCount = await getQuestionCount(formId);

  const question = await createQuestion({
    form_id: formId,
    question_text,
    question_type,
    required: required || false,
    options: options || {},
    order_index: questionCount
  });

  res.status(201).json({
    status: 'success',
    data: {
      question
    }
  });
});

// @desc    批量創建問題
// @route   POST /api/forms/:formId/questions/batch
// @access  Private
export const createQuestionsBatch = asyncHandler(async (req, res, next) => {
  const formId = req.params.formId;
  const userId = req.user.id;
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return next(new AppError('Questions array is required', 400));
  }

  // 檢查表單是否存在且屬於當前使用者
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  // 驗證每個問題
  for (const question of questions) {
    if (!question.question_text || question.question_text.trim().length === 0) {
      return next(new AppError('Question text is required for all questions', 400));
    }
    if (!question.question_type || !['short_answer', 'long_answer', 'single_choice', 'multiple_choice', 'file_upload'].includes(question.question_type)) {
      return next(new AppError('Invalid question type', 400));
    }
  }

  // 獲取當前問題數量作為起始 order_index
  const currentCount = await getQuestionCount(formId);

  // 添加 form_id 和 order_index
  const questionsWithMetadata = questions.map((question, index) => ({
    ...question,
    form_id: formId,
    order_index: currentCount + index
  }));

  const createdQuestions = await createQuestions(questionsWithMetadata);

  res.status(201).json({
    status: 'success',
    results: createdQuestions.length,
    data: {
      questions: createdQuestions
    }
  });
});

// @desc    更新問題
// @route   PUT /api/forms/:formId/questions/:questionId
// @access  Private
export const updateExistingQuestion = asyncHandler(async (req, res, next) => {
  const { formId, questionId } = req.params;
  const userId = req.user.id;
  const { question_text, question_type, required, options } = req.body;

  // 檢查表單是否存在且屬於當前使用者
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  // 檢查問題是否存在
  if (!(await questionExists(questionId, formId))) {
    return next(new AppError('Question not found', 404));
  }

  // 驗證問題類型
  if (question_type && !['short_answer', 'long_answer', 'single_choice', 'multiple_choice', 'file_upload'].includes(question_type)) {
    return next(new AppError('Invalid question type', 400));
  }

  const question = await updateQuestion(questionId, {
    question_text,
    question_type,
    required,
    options
  }, formId);

  res.status(200).json({
    status: 'success',
    data: {
      question
    }
  });
});

// @desc    刪除問題
// @route   DELETE /api/forms/:formId/questions/:questionId
// @access  Private
export const deleteExistingQuestion = asyncHandler(async (req, res, next) => {
  const { formId, questionId } = req.params;
  const userId = req.user.id;

  // 檢查表單是否存在且屬於當前使用者
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  // 檢查問題是否存在
  if (!(await questionExists(questionId, formId))) {
    return next(new AppError('Question not found', 404));
  }

  await deleteQuestion(questionId, formId);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    重新排序問題
// @route   PATCH /api/forms/:formId/questions/reorder
// @access  Private
export const reorderFormQuestions = asyncHandler(async (req, res, next) => {
  const formId = req.params.formId;
  const userId = req.user.id;
  const { questionOrders } = req.body;

  if (!Array.isArray(questionOrders)) {
    return next(new AppError('Question orders array is required', 400));
  }

  // 檢查表單是否存在且屬於當前使用者
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  // 驗證 questionOrders 格式
  for (const order of questionOrders) {
    if (!order.id || order.order_index === undefined) {
      return next(new AppError('Each question order must have id and order_index', 400));
    }
  }

  await reorderQuestions(formId, questionOrders);

  // 重新獲取更新後的問題列表
  const questions = await getQuestionsByFormId(formId);

  res.status(200).json({
    status: 'success',
    data: {
      questions
    }
  });
});