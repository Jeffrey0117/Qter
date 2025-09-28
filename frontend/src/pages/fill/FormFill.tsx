import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, formApi } from '../../services/api';
import { Form as QForm, Question } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Spinner } from '../../components/ui/spinner';
import { AlertTriangle, Upload, Trash2, RefreshCcw, CheckCircle2 } from 'lucide-react';

// ---- helpers ----
const toMimePattern = (types?: string[] | null) => {
  if (!types || types.length === 0) return undefined;
  return types.join(',');
};

// Build zod schema from questions
const buildSchema = (questions: Question[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) {
    const key = String(q.id);
    const v = q.validation || {};
    switch (q.type) {
      case 'short_answer': {
        let schema = z.string().trim();
        if (v.minLength) schema = schema.min(v.minLength, `最少 ${v.minLength} 字`);
        if (v.maxLength) schema = schema.max(v.maxLength, `最多 ${v.maxLength} 字`);
        shape[key] = q.isRequired ? schema.min(1, '此題為必填') : schema.optional().or(z.literal(''));
        break;
      }
      case 'long_answer': {
        let schema = z.string().trim();
        if (v.minLength) schema = schema.min(v.minLength, `最少 ${v.minLength} 字`);
        if (v.maxLength) schema = schema.max(v.maxLength, `最多 ${v.maxLength} 字`);
        shape[key] = q.isRequired ? schema.min(1, '此題為必填') : schema.optional().or(z.literal(''));
        break;
      }
      case 'single_choice': {
        const schema = z.string();
        shape[key] = q.isRequired ? schema.min(1, '此題為必選') : schema.optional();
        break;
      }
      case 'multiple_choice': {
        const schema = z.array(z.string()).refine(arr => new Set(arr).size === arr.length, '選項重複');
        shape[key] = q.isRequired ? schema.min(1, '至少選擇一項') : schema.optional();
        break;
      }
      case 'file_upload': {
        // We store uploaded file IDs (number[]) locally for submission
        const schema = z.array(z.union([z.string(), z.number()]));
        shape[key] = q.isRequired ? schema.min(1, '需至少上傳一個檔案') : schema.optional().default([]);
        break;
      }
      default:
        shape[key] = z.any().optional();
    }
  }
  return z.object(shape);
};

// ---- FileUpload widget ----
type UploadItem = {
  localId: string;
  file?: File;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  serverId?: number | string;
  url?: string;
  name: string;
  size: number;
  type: string;
  error?: string;
};

const bytesToMB = (size: number) => (size / (1024 * 1024)).toFixed(2);

const FileUpload: React.FC<{
  value: (number | string)[] | undefined;
  onChange: (ids: (number | string)[]) => void;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[] | null;
}> = ({ value, onChange, maxFileSizeMB = 10, allowedFileTypes }) => {
  const [items, setItems] = useState<UploadItem[]>([]);

  useEffect(() => {
    // when parent value changes (e.g., reset), align our items to reflect already uploaded ids (no URL known)
    if (!value || value.length === 0) {
      setItems([]);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return `檔案超過 ${maxFileSizeMB}MB（目前 ${bytesToMB(file.size)}MB）`;
    }
    if (allowedFileTypes && allowedFileTypes.length > 0) {
      // accept patterns like image/* or exact mimetype
      const pass = allowedFileTypes.some((t) => {
        if (t.endsWith('/*')) {
          const prefix = t.slice(0, -1);
          return file.type.startsWith(prefix);
        }
        return file.type === t;
      });
      if (!pass) return `不支援的檔案類型 (${file.type})`;
    }
    return null;
  };

  const handleInput = async (files: FileList | null) => {
    if (!files) return;
    const newOnes: UploadItem[] = [];
    for (const f of Array.from(files)) {
      const err = validateFile(f);
      if (err) {
        newOnes.push({
          localId: crypto.randomUUID(),
          file: f,
          status: 'error',
          progress: 0,
          name: f.name,
          size: f.size,
          type: f.type,
          error: err,
        });
        continue;
      }
      newOnes.push({
        localId: crypto.randomUUID(),
        file: f,
        status: 'idle',
        progress: 0,
        name: f.name,
        size: f.size,
        type: f.type,
      });
    }
    setItems((prev) => [...prev, ...newOnes]);
    // auto start upload
    for (const it of newOnes) {
      if (it.status === 'idle' && it.file) {
        await uploadOne(it.localId, it.file);
      }
    }
  };

  const uploadOne = async (localId: string, file: File) => {
    setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, status: 'uploading', progress: 0, error: undefined } : i)));
    try {
      const res = await api.file.uploadFile(file, (p) => {
        setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, progress: p } : i)));
      });
      const data = res.data?.data ?? res.data; // backend returns {status,data:{...}}
      const serverId = data?.id ?? data?.fileId ?? data?.file_id;
      const url = data?.url;
      setItems((prev) =>
        prev.map((i) => (i.localId === localId ? { ...i, status: 'success', serverId, url, progress: 100 } : i))
      );
      const ids = (value ?? []).concat(serverId);
      onChange(ids);
    } catch (e: any) {
      setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, status: 'error', error: '上傳失敗，請重試' } : i)));
    }
  };

  const removeOne = (localId: string) => {
    const target = items.find((i) => i.localId === localId);
    setItems((prev) => prev.filter((i) => i.localId !== localId));
    if (target?.serverId) {
      onChange((value ?? []).filter((id) => String(id) !== String(target.serverId)));
      // optional: call delete API only for authenticated users; backend requires auth to delete
      // We skip delete here because public fill may be anonymous.
    }
  };

  const retry = async (localId: string) => {
    const target = items.find((i) => i.localId === localId);
    if (target?.file) {
      await uploadOne(localId, target.file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed rounded-md p-4 text-center">
        <Label className="block mb-2">拖曳或選擇檔案（上限 {maxFileSizeMB}MB）</Label>
        <input
          type="file"
          multiple
          accept={toMimePattern(allowedFileTypes)}
          onChange={(e) => handleInput(e.target.files)}
          className="mx-auto block"
        />
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.localId} className="flex items-center justify-between rounded border p-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0 rounded bg-muted p-2">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{bytesToMB(it.size)} MB</p>
                  {it.status === 'uploading' && (
                    <div className="w-full mt-1 h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${it.progress}%` }} />
                    </div>
                  )}
                  {it.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{it.error || '上傳失敗'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {it.status === 'error' && (
                  <Button size="sm" variant="outline" onClick={() => retry(it.localId)}>重試</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => removeOne(it.localId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---- Main Form Fill Page ----
type DraftState = {
  [questionId: string]: any;
};

const LOCAL_DRAFT_PREFIX = 'form_draft_';

const FormFill: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formId = Number(id);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-form', formId],
    queryFn: async () => {
      // Prefer backend public endpoint if available
      try {
        const res = await formApi.getForm(String(formId));
        return res as QForm;
      } catch {
        // Fallback for public forms
        const res = await formApi.getForm(String(formId));
        return res as QForm;
      }
    },
  });

  const questions = useMemo(() => {
    const qs = (data?.questions ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    return qs;
  }, [data]);

  const schema = useMemo(() => buildSchema(questions), [questions]);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Record<string, any>>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: {},
  });

  // Load draft
  useEffect(() => {
    if (!formId || questions.length === 0) return;
    const key = `${LOCAL_DRAFT_PREFIX}${formId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed: DraftState = JSON.parse(raw);
        // only keep keys that exist in current questions
        const allowKeys = new Set(questions.map((q) => String(q.id)));
        const filtered: Record<string, any> = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (allowKeys.has(k)) filtered[k] = v;
        });
        reset(filtered);
      } catch {}
    }
  }, [formId, questions, reset]);

  // Save draft
  const saveDraft = () => {
    const values = getValues();
    localStorage.setItem(`${LOCAL_DRAFT_PREFIX}${formId}`, JSON.stringify(values));
    alert('草稿已儲存');
  };

  const clearDraft = () => {
    localStorage.removeItem(`${LOCAL_DRAFT_PREFIX}${formId}`);
  };

  const { mutateAsync: submitMutation, isLoading: submitting } = useMutation({
    mutationFn: async (payload: any) => {
      return formApi.submitResponse(String(formId), payload);
    },
  });

  const onSubmit = async (values: Record<string, any>) => {
    // Convert to backend expected { formId, answers: [{ questionId, value }] }
    const answers = questions.map((q) => {
      const val = values[String(q.id)];
      return { questionId: q.id, value: val ?? (q.type === 'multiple_choice' ? [] : '') };
    });
    try {
      const res = await submitMutation({ formId, answers });
      clearDraft();
      setSubmittedId(res.data?.responseId);
      setSubmitState('success');
    } catch (e: any) {
      setSubmitState('error');
      setSubmitError(e?.response?.data?.error || '提交失敗');
    }
  };

  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
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

  if (submitState === 'success') {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              提交成功
            </CardTitle>
            <CardDescription>感謝您的填寫（回應編號：{submittedId}）</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/dashboard">返回首頁</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = data as QForm;

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && <p className="text-muted-foreground mt-1">{form.description}</p>}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">此表單尚無題目</CardContent>
          </Card>
        ) : (
          questions.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">{q.title}{q.isRequired && <span className="text-red-600 ml-1">*</span>}</CardTitle>
                {q.description && <CardDescription>{q.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2">
                {q.type === 'short_answer' && (
                  <Controller
                    control={control}
                    name={String(q.id)}
                    render={({ field }) => (
                      <Input placeholder="請輸入" {...field} />
                    )}
                  />
                )}

                {q.type === 'long_answer' && (
                  <Controller
                    control={control}
                    name={String(q.id)}
                    render={({ field }) => (
                      <textarea
                        placeholder="請輸入"
                        className="w-full min-h-[120px] rounded-md border border-input p-3 text-sm"
                        {...field}
                      />
                    )}
                  />
                )}

                {q.type === 'single_choice' && (
                  <Controller
                    control={control}
                    name={String(q.id)}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {(q.options ?? []).map((opt, idx) => (
                          <label key={idx} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              value={opt}
                              checked={field.value === opt}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                )}

                {q.type === 'multiple_choice' && (
                  <Controller
                    control={control}
                    name={String(q.id)}
                    defaultValue={[]}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {(q.options ?? []).map((opt, idx) => {
                          const checked = Array.isArray(field.value) ? field.value.includes(opt) : false;
                          return (
                            <label key={idx} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const arr = new Set(stringArray(field.value));
                                  if (e.target.checked) arr.add(opt);
                                  else arr.delete(opt);
                                  field.onChange(Array.from(arr));
                                }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                )}

                {q.type === 'file_upload' && (
                  <Controller
                    control={control}
                    name={String(q.id)}
                    defaultValue={[]}
                    render={({ field }) => (
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                        maxFileSizeMB={(q.validation?.maxFileSize ?? 10)}
                        allowedFileTypes={q.validation?.allowedFileTypes ?? null}
                      />
                    )}
                  />
                )}

                {errors[String(q.id)] && (
                  <p className="text-sm text-red-600">{String((errors as any)[String(q.id)]?.message || '欄位有誤')}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {submitState === 'error' && (
          <div className="text-red-600 text-sm">{submitError}</div>
        )}

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={saveDraft}>儲存草稿</Button>
          <Button type="submit" disabled={isSubmitting || submitting}>提交</Button>
        </div>
      </form>
    </div>
  );
};

// helpers
function stringArray(val: any): string[] {
  if (Array.isArray(val)) return val.map((v) => String(v));
  return [];
}

export default FormFill;