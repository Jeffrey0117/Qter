import React from 'react';

// 最簡單的 React 組件測試
const SimpleTest: React.FC = () => {
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f0f9ff',
      border: '2px solid #0ea5e9',
      borderRadius: '10px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#0ea5e9', marginBottom: '1rem' }}>
        🎉 React 應用正常運行！
      </h1>
      <div style={{
        backgroundColor: '#dcfce7',
        color: '#166534',
        padding: '1rem',
        borderRadius: '5px',
        marginBottom: '1rem'
      }}>
        ✅ JavaScript 正常執行<br/>
        ✅ React 組件正常渲染<br/>
        ✅ 樣式正常應用
      </div>
      <p style={{ marginBottom: '1rem' }}>
        如果您能看到這個頁面，表示 React 應用完全正常！
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <a
          href="/"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4f46e5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          返回主頁
        </a>
        <a
          href="/login"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          前往登入頁面
        </a>
      </div>
    </div>
  );
};

export default SimpleTest;