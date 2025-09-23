import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Form, Question } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { AlertTriangle, RefreshCcw, Upload, CheckSquare, CircleDot } from 'lucide-react';

const QuestionPreview: React.FC<{ q: Question }> = ({ q }) => {
  const label = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
      {q.type === 'short_answer' && <span className="inline-flex items-center gap-1"><span className="i"></span></span>}
      {q.type === 'long_answer' && <span className="inline-flex items-center gap-1"><span className="i"></span></span>}
      {q.type === 'single_choice' && <CircleDot className="h-3 w-3" />}
      {q.type === 'multiple_choice' && <CheckSquare className="h-3 w-3" />}
      {q.type === 'file_upload' && <Upload className="h-3 w-3" />}
      <span>{q.isRequired ? '必填' : '選填'}</span>
    </div>
  );

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{q.title}</CardTitle>
        {q.description && <CardDescription>{q.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {label}
        {q.type === 'short_answer' && (
          <input
            disabled
            placeholder="短答題預覽"
            className="w-full h-10 rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground"
          />
        )}
        {q.type === 'long_answer' && (
          <textarea
            disabled
            placeholder="長答題預覽"
            className="w-full min-h-[120px] rounded-md border border-input bg-muted/30 p-3 text-sm text-muted-foreground"
          />
        )}
        {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
          <div className="space-y-2">
            {(q.options ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">此題尚未設定選項</p>
            ) : (
              (q.options ?? []).map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type={q.type === 'single_choice' ? 'radio' : 'checkbox'} disabled />
                  {opt}
                </label>
              ))
            )}
          </div>
        )}
        {q.type === 'file_upload' && (
          <div className="border-2 border-dashed rounded-md p-6 text-center text-sm text-muted-foreground bg-muted/20">
            <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            上傳區塊示意（預覽不實際上傳）
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const FormPreview: React.FC = () => {
  const { id } = useParams();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['form', id],
    queryFn: async () => {
      const res = await api.getForm(Number(id));
      return res.data as Form;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-10">
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              無法載入表單
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => refetch()}>
                <RefreshCcw className="h-4 w-4 mr-2" /> 重新嘗試
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">返回儀表板</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = data!;
  const questions = form.questions ?? [];

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground mt-1">{form.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/forms/${form.id}/edit`}>返回編輯</Link>
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" /> 刷新
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            此表單尚無題目
          </CardContent>
        </Card>
      ) : (
        <div>
          {questions
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((q) => (
              <QuestionPreview key={q.id} q={q} />
            ))}
        </div>
      )}
    </div>
  );
};

export default FormPreview;