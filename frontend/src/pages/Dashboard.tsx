import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import api from '../services/api';
import { Form } from '../types';
import {
  PlusCircle,
  FileText,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Calendar,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart,
  Share2,
  Download
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [publicForms, setPublicForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('my-forms');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalForms, setTotalForms] = useState(0);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchForms();
  }, [currentPage, searchTerm, currentTab]);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: currentTab === 'my-forms' ? undefined : 'published'
      };
      
      const response = await api.getForms(params);
      
      if (currentTab === 'my-forms') {
        setForms(response.data.data);
      } else {
        setPublicForms(response.data.data);
      }
      
      setTotalPages(response.data.totalPages || 1);
      setTotalForms(response.data.total || 0);
    } catch (err: any) {
      setError('無法載入表單列表');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, currentTab]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除這個表單嗎？此操作無法復原。')) {
      return;
    }

    try {
      await api.deleteForm(id);
      fetchForms();
    } catch (err) {
      alert('刪除表單失敗');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await api.duplicateForm(id);
      fetchForms();
    } catch (err) {
      alert('複製表單失敗');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await api.publishForm(id);
      fetchForms();
    } catch (err) {
      alert('發布表單失敗');
    }
  };

  const handleUnpublish = async (id: number) => {
    try {
      await api.unpublishForm(id);
      fetchForms();
    } catch (err) {
      alert('取消發布失敗');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchForms();
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderFormCard = (form: Form) => (
    <Card key={form.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="line-clamp-1">
              {form.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {form.description || '無描述'}
            </CardDescription>
          </div>
          <div className="ml-2">
            {form.status === 'published' ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                已發布
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                草稿
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistics */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{form.responseCount || 0} 回應</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(form.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to={`/forms/${form.id}/responses`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <BarChart className="h-4 w-4 mr-1" />
                統計
              </Button>
            </Link>
            <Link to={`/forms/${form.id}/edit`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="h-4 w-4 mr-1" />
                編輯
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/forms/${form.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    預覽表單
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  複製表單
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/forms/${form.id}/share`}>
                    <Share2 className="h-4 w-4 mr-2" />
                    分享表單
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {form.status === 'draft' ? (
                  <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    發布表單
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleUnpublish(form.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    取消發布
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(form.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除表單
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <Card className="p-12">
      <div className="text-center space-y-4">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">還沒有表單</h2>
        <p className="text-muted-foreground">
          {currentTab === 'my-forms'
            ? '建立您的第一個表單開始收集回應'
            : '目前沒有公開的表單'}
        </p>
        {currentTab === 'my-forms' && (
          <Link to="/forms/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              建立表單
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {totalForms} 個表單，第 {currentPage} / {totalPages} 頁
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            上一頁
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一頁
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">表單管理</h1>
          <p className="text-muted-foreground mt-2">
            歡迎回來，{user?.name}！
          </p>
        </div>
        <Link to="/forms/new">
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            建立新表單
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜尋表單..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button type="submit">搜尋</Button>
      </form>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-forms">我的表單</TabsTrigger>
          <TabsTrigger value="public-forms">公開表單</TabsTrigger>
        </TabsList>

        <TabsContent value="my-forms" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchForms}>重新載入</Button>
            </div>
          ) : forms.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {forms.map(renderFormCard)}
              </div>
              {renderPagination()}
            </>
          )}
        </TabsContent>

        <TabsContent value="public-forms" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchForms}>重新載入</Button>
            </div>
          ) : publicForms.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicForms.map(renderFormCard)}
              </div>
              {renderPagination()}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};