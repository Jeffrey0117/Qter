# 快速修復：找不到問卷問題

## 問題原因

您在本地創建的問卷 `1763222836170` 只存在於：
- **您的瀏覽器 localStorage** (`qter_forms`)
- **沒有同步到 Supabase 資料庫**

所以：
- ✅ 本地可以看到（http://localhost:5174/fill/1763222836170）
- ❌ Vercel 看不到（https://qter.vercel.app/fill/1763222836170）

---

## 解決方案 1：手動同步問卷到資料庫（推薦）

### 步驟：

1. **開啟瀏覽器開發者工具**
   - 按 F12
   - 切換到 **Console** 標籤

2. **執行以下腳本將問卷同步到 Supabase：**

```javascript
// 1. 取得本地問卷
const forms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
const targetForm = forms.find(f => f.id === '1763222836170')

if (!targetForm) {
  console.error('找不到問卷！')
} else {
  console.log('找到問卷：', targetForm.title)

  // 2. 同步到 Supabase
  fetch('https://ihhucjcbhyakrenmpryh.supabase.co/rest/v1/forms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaHVjamNiaHlha3Jlbm1wcnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk5MjksImV4cCI6MjA3ODc5NTkyOX0.lLn455Jg5iiW9JhfWS-nr__Np-z6H8lVHn4eI95rVUg',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaHVjamNiaHlha3Jlbm1wcnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk5MjksImV4cCI6MjA3ODc5NTkyOX0.lLn455Jg5iiW9JhfWS-nr__Np-z6H8lVHn4eI95rVUg',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: targetForm.id,
      user_id: 'demo', // 使用測試用戶
      title: targetForm.title,
      description: targetForm.description || '',
      questions: targetForm.questions,
      markdown_content: targetForm.markdownContent || '',
      display_mode: targetForm.displayMode || 'step-by-step',
      auto_advance: targetForm.autoAdvance ?? true,
      auto_advance_delay: targetForm.autoAdvanceDelay ?? 300,
      show_progress: targetForm.showProgress ?? true,
      allow_go_back: targetForm.allowGoBack ?? true
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('✅ 問卷已同步到資料庫！', data)

    // 3. 創建公開分享連結
    const hash = Math.random().toString(36).substring(2, 14)
    return fetch('https://ihhucjcbhyakrenmpryh.supabase.co/rest/v1/share_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaHVjamNiaHlha3Jlbm1wcnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk5MjksImV4cCI6MjA3ODc5NTkyOX0.lLn455Jg5iiW9JhfWS-nr__Np-z6H8lVHn4eI95rVUg',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaHVjamNiaHlha3Jlbm1wcnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk5MjksImV4cCI6MjA3ODc5NTkyOX0.lLn455Jg5iiW9JhfWS-nr__Np-z6H8lVHn4eI95rVUg',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        form_id: targetForm.id,
        hash: hash,
        is_enabled: true,
        allow_anonymous: true
      })
    })
  })
  .then(res => res.json())
  .then(shareLink => {
    console.log('✅ 分享連結已創建！')
    console.log('🔗 公開填寫連結：https://qter.vercel.app/fill/' + targetForm.id)
    console.log('🔗 或使用 hash：https://qter.vercel.app/s/' + shareLink[0].hash)
  })
  .catch(err => console.error('❌ 同步失敗：', err))
}
```

3. **等待執行完成**，應該會看到：
   ```
   ✅ 問卷已同步到資料庫！
   ✅ 分享連結已創建！
   🔗 公開填寫連結：https://qter.vercel.app/fill/1763222836170
   ```

---

## 解決方案 2：在編輯器中重新儲存

1. 打開 http://localhost:5174
2. 進入儀表板，找到問卷 `1763222836170`
3. 點擊編輯
4. 確保**已經登入**（如果沒有，先用 Google 登入）
5. 修改任何內容（例如加個空格）
6. 點擊**儲存**
7. 同步狀態應該變成 🟢 **已同步**

---

## 驗證是否成功

同步後，訪問：
```
https://qter.vercel.app/fill/1763222836170
```

應該能正常看到問卷！

---

## 為什麼會這樣？

- **離線模式**：未登入時，問卷只存在 localStorage
- **需要登入**：要同步到雲端資料庫，必須先用 Google 登入
- **RLS 政策**：Supabase 的資料庫有權限控制

**建議：**
1. 先在本地測試，確保問卷正常
2. **登入後再儲存**，這樣會自動同步到雲端
3. 或使用上面的腳本手動同步
