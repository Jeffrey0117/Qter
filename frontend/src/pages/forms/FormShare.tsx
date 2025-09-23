import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { Copy, Check, AlertTriangle, RefreshCcw, Link as LinkIcon, QrCode, ArrowLeft, ExternalLink } from 'lucide-react';

type FormDetail = {
  id: number;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  isPublic: boolean;
  settings?: {
    expireAt?: string | null;
    responseLimit?: number | null;
    passwordProtected?: boolean | null;
    domainWhiteList?: string[] | null;
  } | null;
};

const getPublicFillUrl = (id: number) => {
  const base = window.location.origin;
  // 假設前台填寫頁為 /forms/:id （或 /forms/:id/preview 作內部預覽）
  return `${base}/forms/${id}`;
};

const FormShare: React.FC = () => {
  const { id } = useParams();
  const formId = Number(id);
  const qc = useQueryClient();
  const [copied, setCopied] = React.useState(false);
  const shareUrl = getPublicFillUrl(formId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const res = await api.getForm(formId);
      return res.data as { data: FormDetail };
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (data?.data.isPublic) {
        return api.unpublishForm(formId);
      }
      return api.publishForm(formId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form', formId] });
    },
  });

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('複製失敗，請手動選取複製。');
    }
  };

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
              無法載入分享設定
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

  const form = data.data;
  const isPublic = form.isPublic;

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/forms/${id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> 返回表單
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">分享表單</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isPublic ? 'outline' : 'default'}
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
          >
            {isPublic ? '取消發布' : '發布表單'}
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            分享連結
          </CardTitle>
          <CardDescription>將此連結分享給受眾即可填寫此表單</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              value={shareUrl}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex gap-2">
              <Button onClick={onCopy} variant="secondary">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? '已複製' : '複製'}
              </Button>
              <Button variant="outline" asChild>
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  開啟
                </a>
              </Button>
            </div>
          </div>

          {!isPublic && (
            <div className="flex items-start gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                目前為私有狀態，受眾無法存取此連結。請點擊「發布表單」以公開此表單。
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </CardTitle>
          <CardDescription>掃描 QR Code 前往填寫頁</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {/* 使用 qrcode.react */}
          {/* @ts-ignore */}
          <QR value={shareUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>安全與到期/上限設定</CardTitle>
          <CardDescription>根據後端 settings 顯示目前限制狀態</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            狀態：{isPublic ? (
              <span className="text-green-600">已發布（公開）</span>
            ) : (
              <span className="text-gray-500">草稿（私有）</span>
            )}
          </div>
          <div>
            到期時間：{form.settings?.expireAt ? new Date(form.settings.expireAt).toLocaleString('zh-TW') : '未設定'}
          </div>
          <div>
            回應上限：{typeof form.settings?.responseLimit === 'number' ? form.settings.responseLimit : '未設定'}
          </div>
          <div>
            密碼保護：{form.settings?.passwordProtected ? '已啟用' : '未啟用'}
          </div>
          <div>
            網域白名單：{form.settings?.domainWhiteList?.length ? form.settings.domainWhiteList.join('、') : '未設定'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 簡易封裝 qrcode.react 的導入（避免全檔案層級引入失敗時崩潰）
const QR: React.FC<{ value: string }> = ({ value }) => {
  const [Comp, setComp] = React.useState<React.ComponentType<{ value: string; size?: number }> | null>(null);
  React.useEffect(() => {
    let mounted = true;
    import('qrcode.react').then((mod) => {
      if (!mounted) return;
      // 支援 default 或命名匯出
      const Any = (mod as any).default ?? (mod as any).QRCodeCanvas ?? (mod as any).QRCodeSVG ?? null;
      setComp(() => Any);
    }).catch(() => setComp(null));
    return () => { mounted = false; };
  }, []);
  if (!Comp) {
    return (
      <div className="w-full flex justify-center py-8 text-muted-foreground text-sm">載入 QR 元件中…</div>
    );
  }
  return <Comp value={value} size={200} />;
};

export default FormShare;