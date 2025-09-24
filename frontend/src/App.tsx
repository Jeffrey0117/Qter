import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Simple pages for testing
const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        🏠 QTER 首頁
      </h1>
      <p className="text-gray-600 mb-6">
        歡迎使用 QTER 問卷系統！完整的表單管理功能已準備就緒。
      </p>
      <div className="space-y-3">
        <a
          href="/dashboard"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
        >
          📊 進入儀表板
        </a>
        <a
          href="/forms/new"
          className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
        >
          ➕ 建立新表單
        </a>
      </div>
    </div>
  </div>
);

const DashboardPage = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-gray-900">QTER 儀表板</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">歡迎使用系統</span>
            <a
              href="/forms/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              新建表單
            </a>
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">建立表單</h3>
              <p className="text-gray-600 text-sm">設計和發布您的問卷</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">收集回應</h3>
              <p className="text-gray-600 text-sm">查看和管理表單回應</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">數據分析</h3>
              <p className="text-gray-600 text-sm">分析回應數據和統計</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">最近的表單</h2>
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 text-center text-gray-500">
            <p>尚未建立任何表單</p>
            <p className="text-sm mt-1">點擊「新建表單」開始您的第一個問卷</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NewFormPage = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-gray-900">建立新表單</h1>
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              返回
            </a>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              儲存草稿
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              發布表單
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">表單設定</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表單標題
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入表單標題"
                  defaultValue="我的問卷"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表單描述
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="輸入表單描述（選填）"
                  defaultValue="請填寫以下問題，感謝您的參與！"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">題目列表</h3>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                新增題目
              </button>
            </div>

            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg">尚未添加任何題目</p>
              <p className="text-sm mt-2">點擊「新增題目」按鈕開始設計您的問卷</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/forms/new" element={<NewFormPage />} />
        <Route path="/login" element={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">登入 QTER</h1>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="電子郵件"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="密碼"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                  登入
                </button>
              </div>
              <div className="mt-4 text-center">
                <a href="/register" className="text-blue-600 hover:text-blue-800 text-sm">
                  還沒有帳號？立即註冊
                </a>
              </div>
            </div>
          </div>
        } />
        <Route path="/register" element={
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">註冊帳號</h1>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="姓名"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="email"
                  placeholder="電子郵件"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="password"
                  placeholder="密碼"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="password"
                  placeholder="確認密碼"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                  註冊
                </button>
              </div>
              <div className="mt-4 text-center">
                <a href="/login" className="text-green-600 hover:text-green-800 text-sm">
                  已有帳號？立即登入
                </a>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;