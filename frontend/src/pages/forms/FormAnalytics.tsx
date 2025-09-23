import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { FormStatistics, Question } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { AlertTriangle, RefreshCcw, ArrowLeft, Download } from 'lucide-react';

// 動態載入 Recharts（避免初次載入重量）
const useRecharts = () => {
  const [mods, setMods] = React.useState<null | {
    LineChart: any;
    Line: any;
    XAxis: any;
    YAxis: any;
    CartesianGrid: any;
    Tooltip: any;
    ResponsiveContainer: any;
    PieChart: any;
    Pie: any;
    Cell: any;
    BarChart: any;
    Bar: any;
    Legend: any;
  }>(null);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      import('recharts'),
    ]).then(([re]) => {
      if (!mounted) return;
      setMods({
        LineChart: re.LineChart,
        Line: re.Line,
        XAxis: re.XAxis,
        YAxis: re.YAxis,
        CartesianGrid: re.CartesianGrid,
        Tooltip: re.Tooltip,
        ResponsiveContainer: re.ResponsiveContainer,
        PieChart: re.PieChart,
        Pie: re.Pie,
        Cell: re.Cell,
        BarChart: re.BarChart,
        Bar: re.Bar,
        Legend: re.Legend,
      });
    }).catch(() => setMods(null));
    return () => { mounted = false; };
  }, []);
  return mods;
};

const colorPalette = [
  '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#A855F7', '#84CC16', '#EC4899'
];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('zh-TW');

const isChoiceQuestion = (q: Question) => q.type === 'single_choice' || q.type === 'multiple_choice';

const FormAnalytics: React.FC = () => {
  const { id } = useParams();
  const formId = Number(id);
  const recharts = useRecharts();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['form-statistics', formId],
    queryFn: async () => {
      const res = await api.getFormStatistics(formId);
      return res.data as { data: FormStatistics };
    },
  });

  const stats = data?.data;

  const trendData = useMemo(() => {
    if (!stats) return [];
    return (stats.dailyResponses || []).map((d) => ({
      date: formatDate(d.date),
      count: d.count,
    }));
  }, [stats]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-10">
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              無法載入統計資料
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

  const exportCsv = async () => {
    try {
      const res = await api.exportResponses(formId, 'csv');
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${id}_responses.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('匯出失敗');
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/forms/${id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> 返回表單
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">統計與分析</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> 匯出 CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">總回應數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalResponses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">完成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats.completionRate * 100)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">平均完成時間</CardTitle>
            <CardDescription>秒</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats.averageCompletionTime)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>時間趨勢</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 260 }}>
          {!recharts ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">載入圖表元件中…</div>
          ) : (
            <recharts.ResponsiveContainer width="100%" height="100%">
              <recharts.LineChart data={trendData}>
                <recharts.CartesianGrid strokeDasharray="3 3" />
                <recharts.XAxis dataKey="date" />
                <recharts.YAxis allowDecimals={false} />
                <recharts.Tooltip />
                <recharts.Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={false} />
              </recharts.LineChart>
            </recharts.ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {stats.questionStatistics?.filter(qs => isChoiceQuestion(qs.question)).map((qs, idx) => {
        const labels = (qs.question.options || []) as string[];
        const distMap: Record<string, number> = {};
        qs.answerDistribution.forEach(d => { distMap[d.value] = d.count; });
        const chartData = labels.map((l) => ({ name: l, value: distMap[l] || 0 }));

        return (
          <Card key={qs.questionId} className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">{qs.question.title}</CardTitle>
              <CardDescription>回應數：{qs.responseCount}</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              {!recharts ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">載入圖表元件中…</div>
              ) : labels.length <= 5 ? (
                // 少數選項以圓餅圖
                <recharts.ResponsiveContainer width="100%" height="100%">
                  <recharts.PieChart>
                    <recharts.Pie dataKey="value" data={chartData} outerRadius={100} label>
                      {chartData.map((entry, i) => (
                        <recharts.Cell key={i} fill={colorPalette[i % colorPalette.length]} />
                      ))}
                    </recharts.Pie>
                    <recharts.Tooltip />
                    <recharts.Legend />
                  </recharts.PieChart>
                </recharts.ResponsiveContainer>
              ) : (
                // 選項較多以長條圖
                <recharts.ResponsiveContainer width="100%" height="100%">
                  <recharts.BarChart data={chartData}>
                    <recharts.CartesianGrid strokeDasharray="3 3" />
                    <recharts.XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
                    <recharts.YAxis allowDecimals={false} />
                    <recharts.Tooltip />
                    <recharts.Bar dataKey="value" fill="#22C55E" />
                  </recharts.BarChart>
                </recharts.ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FormAnalytics;