import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Spinner } from '../components/ui/spinner';
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
  Users
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await api.getForms();
      setForms(response.data.data);
    } catch (err: any) {
      setError('無法載入表單列表');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除這個表單嗎？此操作無法復原。')) {
      return;
    }

    try {
      await api.deleteForm(id);
      setForms(forms.filter(form => form.id !== id));
    } catch (err) {
      alert('刪除表單失敗');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const response = await api.duplicateForm(id);
      setForms([response.data, ...forms]);
    } catch (err) {
      alert('複製表單失敗');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchForms}>重新載入</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">我的表單</h1>
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

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">還沒有表單</h2>
            <p className="text-muted-foreground">
              建立您的第一個表單開始收集回應
            </p>
            <Link to="/forms/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                建立表單
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
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
                    <Link to={`/forms/${form.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        檢視
                      </Button>
                    </Link>
                    <Link to={`/forms/${form.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        編輯
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(form.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(form.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};