// Google OAuth 配置
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// Google 登入配置選項
export const googleConfig = {
  client_id: GOOGLE_CLIENT_ID,
  callback: handleGoogleLogin,
  auto_select: false,
  cancel_on_tap_outside: true,
  use_fedcm_for_prompt: true
};

// 處理 Google 登入回調
async function handleGoogleLogin(response: any) {
  console.log('Google login response:', response);
  // JWT token 將在這裡處理
}