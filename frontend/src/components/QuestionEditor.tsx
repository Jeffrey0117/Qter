import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Question } from '../types';
import {
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface QuestionEditorProps {
  question: Partial<Question>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Partial<Question>) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(question.title || '');
  const [description, setDescription] = useState(question.description || '');
  const [isRequired, setIsRequired] = useState(question.isRequired || false);
  const [options, setOptions] = useState<string[]>(question.options || ['']);
  const [validation, setValidation] = useState(question.validation || {});

  useEffect(() => {
    setTitle(question.title || '');
    setDescription(question.description || '');
    setIsRequired(question.isRequired || false);
    setOptions(question.options || ['']);
    setValidation(question.validation || {});
  }, [question]);

  const handleSave = () => {
    if (!title.trim()) {
      alert('請輸入題目標題');
      return;
    }

    const updatedQuestion: Partial<Question> = {
      ...question,
      title,
      description,
      isRequired,
      validation,
    };

    if (question.type === 'single_choice' || question.type === 'multiple_choice') {
      const validOptions = options.filter(opt => opt.trim());
      if (validOptions.length === 0) {
        alert('請至少輸入一個選項');
        return;
      }
      updatedQuestion.options = validOptions;
    }

    onSave(updatedQuestion);
    onClose();
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const getTypeLabel = () => {
    switch (question.type) {
      case 'short_answer':
        return '簡答題';
      case 'long_answer':
        return '詳答題';
      case 'single_choice':
        return '單選題';
      case 'multiple_choice':
        return '多選題';
      case 'file_upload':
        return '檔案上傳';
      default:
        return '題目';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {question.id ? '編輯' : '新增'}{getTypeLabel()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">題目標題 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="請輸入題目"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">題目說明</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="補充說明（選填）"
            />
          </div>

          {/* Options for choice questions */}
          {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
            <div>
              <Label>選項</Label>
              <div className="space-y-2 mt-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`選項 ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={options.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增選項
                </Button>
              </div>
            </div>
          )}

          {/* Validation settings */}
          {question.type === 'short_answer' && (
            <div className="space-y-3">
              <h3 className="font-medium">驗證設定</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="minLength">最少字數</Label>
                  <Input
                    id="minLength"
                    type="number"
                    min="0"
                    value={validation.minLength || ''}
                    onChange={(e) => setValidation({
                      ...validation,
                      minLength: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLength">最多字數</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    min="0"
                    value={validation.maxLength || ''}
                    onChange={(e) => setValidation({
                      ...validation,
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {question.type === 'long_answer' && (
            <div className="space-y-3">
              <h3 className="font-medium">驗證設定</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="minLength">最少字數</Label>
                  <Input
                    id="minLength"
                    type="number"
                    min="0"
                    value={validation.minLength || ''}
                    onChange={(e) => setValidation({
                      ...validation,
                      minLength: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLength">最多字數</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    min="0"
                    value={validation.maxLength || ''}
                    onChange={(e) => setValidation({
                      ...validation,
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {question.type === 'file_upload' && (
            <div className="space-y-3">
              <h3 className="font-medium">檔案設定</h3>
              <div>
                <Label htmlFor="maxFileSize">檔案大小限制 (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  min="1"
                  max="100"
                  value={validation.maxFileSize || 10}
                  onChange={(e) => setValidation({
                    ...validation,
                    maxFileSize: parseInt(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label htmlFor="allowedTypes">允許的檔案類型</Label>
                <Input
                  id="allowedTypes"
                  placeholder="例如：image/*,application/pdf"
                  value={validation.allowedFileTypes?.join(',') || ''}
                  onChange={(e) => setValidation({
                    ...validation,
                    allowedFileTypes: e.target.value.split(',').filter(t => t.trim())
                  })}
                />
              </div>
            </div>
          )}

          {/* Required field */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isRequired">設為必填</Label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            儲存
          </Button>
        </div>
      </div>
    </div>
  );
};