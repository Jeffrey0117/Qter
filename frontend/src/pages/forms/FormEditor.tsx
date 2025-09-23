import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import api from '../../services/api';
import { Form, Question } from '../../types';
import { QuestionEditor } from '../../components/QuestionEditor';
import { QuestionEditor } from '../../components/QuestionEditor';
import {
  PlusCircle,
  Save,
  Eye,
  Settings,
  GripVertical,
  Trash2,
  Copy,
  ChevronLeft,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  Upload,
  X,
  Edit3,
} from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, '標題為必填'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface SortableQuestionProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (id: number) => void;
  onDuplicate: (question: Question) => void;
}

const SortableQuestion: React.FC<SortableQuestionProps> = ({
  question,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeIcon = (type: Question['type']) => {
    switch (type) {
      case 'short_answer':
        return <Type className="h-4 w-4" />;
      case 'long_answer':
        return <AlignLeft className="h-4 w-4" />;
      case 'single_choice':
        return <CircleDot className="h-4 w-4" />;
      case 'multiple_choice':
        return <CheckSquare className="h-4 w-4" />;
      case 'file_upload':
        return <Upload className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Question['type']) => {
    switch (type) {
      case 'short_answer':
        return '簡答';
      case 'long_answer':
        return '詳答';
      case 'single_choice':
        return '單選';
      case 'multiple_choice':
        return '多選';
      case 'file_upload':
        return '檔案上傳';
      default:
        return '未知';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border p-4 mb-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-move text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getTypeIcon(question.type)}
                <span className="text-xs text-muted-foreground">
                  {getTypeLabel(question.type)}
                </span>
                {question.isRequired && (
                  <span className="text-xs text-red-500">*必填</span>
                )}
              </div>
              <h3 className="font-medium">{question.title}</h3>
              {question.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {question.description}
                </p>
              )}
              {question.options && (
                <ul className="mt-2 space-y-1">
                  {question.options.map((option, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      {question.type === 'single_choice' ? (
                        <CircleDot className="h-3 w-3" />
                      ) : (
                        <CheckSquare className="h-3 w-3" />
                      )}
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(question)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(question)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(question.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FormEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id && id !== 'new') {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await api.getForm(Number(id));
      const formData = response.data;
      setForm(formData);
      setQuestions(formData.questions || []);
      setValue('title', formData.title);
      setValue('description', formData.description || '');
      setValue('isPublic', formData.isPublic);
    } catch (err) {
      console.error(err);
      alert('無法載入表單');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      if (id === 'new') {
        const response = await api.createForm(data);
        const newFormId = response.data.id;
        navigate(`/forms/${newFormId}/edit`);
      } else {
        await api.updateForm(Number(id), data);
        setForm({ ...form!, ...data });
      }
      alert('表單已儲存');
    } catch (err) {
      console.error(err);
      alert('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over?.id);
      
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newQuestions);

      // Update order in backend
      if (id !== 'new') {
        try {
          await api.reorderQuestions(
            Number(id),
            newQuestions.map(q => q.id)
          );
        } catch (err) {
          console.error('Failed to reorder questions:', err);
        }
      }
    }
  };

  const handleAddQuestion = (type: Question['type']) => {
    const newQuestion: Partial<Question> = {
      id: 0, // Temporary ID for new questions
      type,
      title: '',
      description: '',
      isRequired: false,
      options: type === 'single_choice' || type === 'multiple_choice' ? [''] : null,
      orderIndex: questions.length,
    };
    setEditingQuestion(newQuestion as Question);
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('確定要刪除這個問題嗎？')) return;

    try {
      if (id !== 'new') {
        await api.deleteQuestion(Number(id), questionId);
      }
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      alert('刪除失敗');
    }
  };

  const handleSaveQuestion = useCallback(async (questionData: Partial<Question>) => {
    try {
      if (id !== 'new') {
        if (editingQuestion?.id && editingQuestion.id > 0) {
          // Update existing question
          const response = await api.updateQuestion(Number(id), editingQuestion.id, questionData);
          setQuestions(questions.map(q =>
            q.id === editingQuestion.id ? response.data : q
          ));
        } else {
          // Add new question
          const response = await api.addQuestion(Number(id), questionData);
          setQuestions([...questions, response.data]);
        }
      } else {
        // For new forms, just update local state
        if (editingQuestion?.id && editingQuestion.id > 0) {
          setQuestions(questions.map(q =>
            q.id === editingQuestion.id ? { ...q, ...questionData } as Question : q
          ));
        } else {
          const newQuestion = {
            ...questionData,
            id: Date.now(), // Temporary ID
          } as Question;
          setQuestions([...questions, newQuestion]);
        }
      }
      setShowQuestionModal(false);
      setEditingQuestion(null);
    } catch (err) {
      alert('儲存題目失敗');
    }
  }, [id, editingQuestion, questions]);

  const handleDuplicateQuestion = async (question: Question) => {
    const newQuestion = {
      ...question,
      id: 0,
      title: question.title + ' (副本)',
    };
    
    if (id !== 'new') {
      try {
        const response = await api.addQuestion(Number(id), newQuestion);
        setQuestions([...questions, response.data]);
      } catch (err) {
        alert('複製失敗');
      }
    } else {
      setQuestions([...questions, { ...newQuestion, id: Date.now() } as Question]);
    }
  };

  const handlePublish = async () => {
    if (id === 'new') {
      alert('請先儲存表單');
      return;
    }

    try {
      await api.publishForm(Number(id));
      alert('表單已發布');
      navigate('/dashboard');
    } catch (err) {
      alert('發布失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">
            {id === 'new' ? '建立新表單' : '編輯表單'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/forms/${id}/preview`)}
            disabled={id === 'new'}
          >
            <Eye className="h-4 w-4 mr-2" />
            預覽
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            儲存
          </Button>
          {form?.status === 'draft' && (
            <Button
              variant="default"
              onClick={handlePublish}
              disabled={id === 'new'}
            >
              發布表單
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Settings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>表單設定</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="title">標題 *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="輸入表單標題"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Input
                    id="description"
                    {...register('description')}
                    placeholder="輸入表單描述（選填）"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    {...register('isPublic')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isPublic">設為公開表單</Label>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>題目列表</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      新增題目
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAddQuestion('short_answer')}>
                      <Type className="h-4 w-4 mr-2" />
                      簡答題
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddQuestion('long_answer')}>
                      <AlignLeft className="h-4 w-4 mr-2" />
                      詳答題
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddQuestion('single_choice')}>
                      <CircleDot className="h-4 w-4 mr-2" />
                      單選題
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddQuestion('multiple_choice')}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      多選題
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddQuestion('file_upload')}>
                      <Upload className="h-4 w-4 mr-2" />
                      檔案上傳
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  尚未新增題目
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={questions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {questions.map((question) => (
                      <SortableQuestion
                        key={question.id}
                        question={question}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                        onDuplicate={handleDuplicateQuestion}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>表單資訊</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">狀態</dt>
                  <dd className="font-medium">
                    {form?.status === 'published' ? '已發布' : '草稿'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">題目數量</dt>
                  <dd className="font-medium">{questions.length}</dd>
                </div>
                {form && (
                  <>
                    <div>
                      <dt className="text-sm text-muted-foreground">回應數量</dt>
                      <dd className="font-medium">{form.responseCount || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">建立時間</dt>
                      <dd className="font-medium">
                        {new Date(form.createdAt).toLocaleDateString('zh-TW')}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/forms/${id}/responses`)}
                disabled={id === 'new'}
              >
                查看回應
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/forms/${id}/share`)}
                disabled={id === 'new'}
              >
                分享表單
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={id === 'new'}
              >
                匯出資料
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};