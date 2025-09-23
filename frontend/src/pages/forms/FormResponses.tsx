import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { PaginatedResponse, Response as FormResponse } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';
import { Download, AlertTriangle, RefreshCcw, Search, ChevronLeft, ArrowLeft, Calendar } from 'lucide-react';

type ListQuery = {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
};

export const FormResponses: React.FC = () => {
  const { id } = useParams();
  const [query, setQuery] = useState<ListQuery>({ page: 1, limit: 10, search: '' });
  const [pendingSearch, setPendingSearch] = useState(query.search ?? '');
  const [startDate, setStartDate] = useState(query.startDate ?? '');
  const [endDate, setEndDate] = useState(query.endDate ?? '');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['form-responses', id, query],
    queryFn: async () => {
      const params: any = {
        page: query.page,
        limit: query.limit,
      };
      if (query.search) params.search = query.search;
      if (query.startDate) params.startDate = query.startDate;
      if (query.endDate) params.endDate = query.endDate;

      const res = await api.getFormResponses(Number(id), params);
      return res.data as PaginatedResponse<FormResponse>;
    },
    keepPreviousData: true,
  });

  const totalPages = useMemo(() => (data ? data.totalPages : 1), [data]);

  const applyFilters = () => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: pendingSearch.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }));
  };

  const exportCsv = async () => {
    try {
      const res = await api.exportResponses(Number(id), 'csv');
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${id}_responses.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('匯出失敗');
    }
  };

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
              無法載入回應列表
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => refetch()}>
                <RefreshCcw className="h-4 w-4 mr-2" /> 重新嘗試
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/forms/${id}/edit`}>返回表單</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const list = data?.data ?? [];

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/forms/${id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> 返回表單
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">回應列表</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className="h-4 w-4 mr-2" /> 刷新
          </Button>
          <Button onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> 匯出
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜尋回應者/內容"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={applyFilters}>套用</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          {list.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">目前沒有回應</div>
          ) : (
            <div className="divide-y">
              {list.map((resp) => {
                const summary = resp.answers?.slice(0, 2).map((a) => a.answerText || (a.answerOptions?.join('、')) || (a.fileUrls ? '檔案' : '')).filter(Boolean).join(' / ') || '—';
                const who = resp.respondent?.name || resp.respondentEmail || '匿名';
                const time = new Date(resp.submittedAt).toLocaleString('zh-TW');
                const statusText = '已提交';
                return (
                  <div key={resp.id} className="py-4 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="text-sm font-medium truncate">{who}</div>
                          <div className="text-xs text-muted-foreground truncate">{summary}</div>
                        </div>
                        <div className="text-right min-w-[160px]">
                          <div className="text-xs text-muted-foreground">{time}</div>
                          <div className="text-xs">{statusText}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button variant="link" className="px-0" asChild>
                          <Link to={`/responses/${resp.id}`}>查看詳情（下次實作）</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            第 {data?.page} / {data?.totalPages} 頁（共 {data?.total} 筆）
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={query.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              disabled={query.page >= totalPages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponses;