# Vercel 環境變數設定指南

## 步驟 1: 設定 Vercel 環境變數

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案 `Qter`
3. 點擊 "Settings" → "Environment Variables"
4. 新增以下變數：

```
VITE_GOOGLE_CLIENT_ID = 706567739299-gmdfmcjjtgkna796v74r1p84e4ii2oab.apps.googleusercontent.com
```

5. 選擇環境：
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. 點擊 "Save"

## 步驟 2: 設定 Google OAuth 授權網址

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 前往 "APIs & Services" → "Credentials"
4. 點擊您的 OAuth 2.0 Client ID
5. 在 "Authorized JavaScript origins" 新增：
   ```
   https://qter.vercel.app
   ```

6. 在 "Authorized redirect URIs" 新增（如果有的話）：
   ```
   https://qter.vercel.app/dashboard
   ```

7. 點擊 "SAVE"

## 步驟 3: 重新部署

在 Vercel 設定環境變數後，需要重新部署：

1. 在 Vercel Dashboard
2. 點擊 "Deployments"
3. 找到最新的部署
4. 點擊 "..." → "Redeploy"

或者推送任何 commit 觸發自動部署：
```bash
git commit --allow-empty -m "chore: trigger vercel deployment"
git push
```

## 注意事項

- Google OAuth 設定變更可能需要 5-10 分鐘才會生效
- 確保 Client ID 正確無誤
- 檢查瀏覽器 Console 是否有其他錯誤訊息

## 測試檢查清單

- [ ] Vercel 環境變數已設定
- [ ] Google OAuth 授權網址已新增
- [ ] 重新部署完成
- [ ] 等待 5-10 分鐘
- [ ] 清除瀏覽器快取後測試