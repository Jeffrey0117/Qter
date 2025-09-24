import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import api from '../../services/api';
import { Spinner } from '../../components/ui/spinner';

interface Question {
  id?: number;
  type: 'short_answer' | 'long_answer' | 'radio' | 'checkbox' | 'file_upload';
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface Form {
  id?: number;
  title: string;
  description?: string;
  questions: Question[];
  status: 'draft' | 'published';
}

export const FormEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewForm = !id;

  const [form, setForm] = useState<Form>({
    title: '',
    description: '',
    questions: [],
    status: 'draft'
  });

  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  // Fetch form data if editing existing form
  const { data: formData, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: async () => {
      if (isNewForm) return null;
      const response = await api.get(`/forms/${id}`);
      return response.data;
    },
    enabled: !isNewForm
  });

  useEffect(() => {
    if (formData) {
      setForm(formData);
    }
  }, [formData]);

  const saveFormMutation = useMutation({
    mutationFn: async (formData: Form) => {
      if (isNewForm) {
        return api.post('/forms', formData);
      } else {
        return api.put(`/forms/${id}`, formData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      if (isNewForm) {
        navigate(`/forms/${response.data.id}/edit`);
      }
    }
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      type: 'short_answer',
      title: '',
      required: false,
      order: form.questions.length + 1
    };
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setSelectedQuestion(form.questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    setSelectedQuestion(null);
  };

  const handleSave = () => {
    saveFormMutation.mutate(form);
  };

  const handlePublish = () => {
    const updatedForm = { ...form, status: 'published' as const };
    setForm(updatedForm);
    saveFormMutation.mutate(updatedForm);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isNewForm ? '新建表單' : '編輯表單'}
        </h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            返回
          </Button>
          <Button variant="outline" onClick={handleSave}>
            保存草稿
          </Button>
          <Button onClick={handlePublish}>
            發布表單
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>表單設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">表單標題</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="輸入表單標題"
                />
              </div>
              <div>
                <Label htmlFor="description">表單描述</Label>
                <Textarea
                  id="description"
                  value={form.description || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="輸入表單描述（選填）"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>題目列表</CardTitle>
              <Button onClick={addQuestion}>
                新增題目
              </Button>
            </CardHeader>
            <CardContent>
              {form.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  尚未添加任何題目，請點擊「新增題目」按鈕開始設計
                </div>
              ) : (
                <div className="space-y-4">
                  {form.questions.map((question, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedQuestion === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedQuestion(index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {question.title || `未命名題目 ${index + 1}`}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {question.type === 'short_answer' && '簡答題'}
                              {question.type === 'long_answer' && '詳答題'}
                              {question.type === 'radio' && '單選題'}
                              {question.type === 'checkbox' && '多選題'}
                              {question.type === 'file_upload' && '檔案上傳'}
                              {question.required && ' • 必填'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQuestion(index);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            刪除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Editor */}
      {selectedQuestion !== null && form.questions[selectedQuestion] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>編輯題目</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionEditor
              question={form.questions[selectedQuestion]}
              onUpdate={(updates) => updateQuestion(selectedQuestion, updates)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Question Editor Component
interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onUpdate }) => {
  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    onUpdate({ options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="question-type">題型</Label>
          <select
            id="question-type"
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as Question['type'] })}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="short_answer">簡答題</option>
            <option value="long_answer">詳答題</option>
            <option value="radio">單選題</option>
            <option value="checkbox">多選題</option>
            <option value="file_upload">檔案上傳</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={question.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded border-gray-300 focus:ring-blue-500"
          />
          <Label htmlFor="required">必填題目</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="question-title">題目內容</Label>
        <Input
          id="question-title"
          value={question.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="輸入題目內容"
        />
      </div>

      <div>
        <Label htmlFor="question-description">題目描述（選填）</Label>
        <Textarea
          id="question-description"
          value={question.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="輸入題目說明"
          rows={2}
        />
      </div>

      {/* Options for radio and checkbox */}
      {(question.type === 'radio' || question.type === 'checkbox') && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>選項</Label>
            <Button variant="outline" size="sm" onClick={addOption}>
              新增選項
            </Button>
          </div>
          <div className="space-y-2">
            {(question.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`選項 ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  刪除
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormEditor;