-- Insert test user
INSERT INTO users (id, email, password_hash) 
VALUES ('demo', 'demo@test.com', 'demo123');

-- Insert test form
INSERT INTO forms (
  id, 
  user_id, 
  title, 
  description, 
  markdown_content, 
  display_mode,
  show_progress_bar,
  enable_auto_advance,
  advance_delay,
  allow_back_navigation
) VALUES (
  'test-survey-2025',
  'demo',
  '產品滿意度調查',
  '請花3分鐘協助我們改進產品',
  '---
title: 產品滿意度調查
description: 您的意見對我們很重要
---

## 1. 您的姓名
type: text
required: true
placeholder: 請輸入您的名字

---

## 2. 整體滿意度
type: rating
required: true
scale: 5
lowLabel: 非常不滿意
highLabel: 非常滿意

---

## 3. 最喜歡的功能
type: checkbox
required: true
options:
  - 問卷編輯器
  - 資料分析
  - 分享功能
  - 自動儲存

---

## 4. 建議與回饋
type: textarea
required: false
placeholder: 請告訴我們您的想法...
rows: 5

---

## 感謝您！
您的回饋已收到，我們會認真參考您的建議。',
  'step-by-step',
  1,
  1,
  2,
  1
);

-- Insert share link
INSERT INTO share_links (
  id,
  form_id,
  hash,
  is_enabled,
  allow_anonymous
) VALUES (
  'sl1',
  'test-survey-2025',
  'demo12345678',
  1,
  1
);