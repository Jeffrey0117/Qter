import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  formExists,
  getPublicForm
} from '../models/formModel.js';
import {
  getQuestionsByFormId,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions
} from '../models/questionModel.js';

// @desc    獲取使用者所有表單
// @route   GET /api/forms
// @access  Private
export const getUserForms = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const {
    published,
    search,
    limit = 10,
    offset = 0
  } = req.query;

  const filters = {
    published: published !== undefined ? published === 'true' : undefined,
    search,
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  const result = await getForms(userId, filters);

  res.status(200).json({
    status: 'success',
    results: result.forms.length,
    total: result.total,
    data: {
      forms: result.forms
    }
  });
});

// @desc    獲取單個表單詳情
// @route   GET /api/forms/:id
// @access  Private
export const getForm = asyncHandler(async (req, res, next) => {
  const formId = req.params.id;
  const userId = req.user.id;

  const form = await getFormById(formId, userId);

  if (!form) {
    return next(new AppError('Form not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      form
    }
  });
});

// @desc    創建新表單
// @route   POST /api/forms
// @access  Private
export const createNewForm = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { title, description, settings } = req.body;

  if (!title || title.trim().length === 0) {
    return next(new AppError('Form title is required', 400));
  }

  const form = await createForm({ title, description, settings }, userId);

  res.status(201).json({
    status: 'success',
    data: {
      form
    }
  });
});

// @desc    更新表單
// @route   PUT /api/forms/:id
// @access  Private
export const updateExistingForm = asyncHandler(async (req, res, next) => {
  const formId = req.params.id;
  const userId = req.user.id;
  const { title, description, settings, published } = req.body;

  // 檢查表單是否存在
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  const form = await updateForm(formId, { title, description, settings, published }, userId);

  res.status(200).json({
    status: 'success',
    data: {
      form
    }
  });
});

// @desc    刪除表單
// @route   DELETE /api/forms/:id
// @access  Private
export const deleteExistingForm = asyncHandler(async (req, res, next) => {
  const formId = req.params.id;
  const userId = req.user.id;

  // 檢查表單是否存在
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  await deleteForm(formId, userId);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    複製表單
// @route   POST /api/forms/:id/duplicate
// @access  Private
export const duplicateExistingForm = asyncHandler(async (req, res, next) => {
  const formId = req.params.id;
  const userId = req.user.id;

  // 檢查表單是否存在
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  const duplicatedForm = await duplicateForm(formId, userId);

  res.status(201).json({
    status: 'success',
    data: {
      form: duplicatedForm
    }
  });
});

// @desc    發布/取消發布表單
// @route   PATCH /api/forms/:id/publish
// @access  Private
export const togglePublishForm = asyncHandler(async (req, res, next) => {
  const formId = req.params.id;
  const userId = req.user.id;
  const { published } = req.body;

  if (published === undefined) {
    return next(new AppError('Published status is required', 400));
  }

  // 檢查表單是否存在
  if (!(await formExists(formId, userId))) {
    return next(new AppError('Form not found', 404));
  }

  const form = await updateForm(formId, { published }, userId);

  res.status(200).json({
    status: 'success',
    data: {
      form
    }
  });
});

// @desc    獲取公開表單（用於填寫）
// @route   GET /api/public/forms/:id
// @access  Public
export const getPublicFormData = asyncHandler(async (req, res, next) => {
  const formId = req.params.id;

  const form = await getPublicForm(formId);

  if (!form) {
    return next(new AppError('Form not found or not published', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      form
    }
  });
});