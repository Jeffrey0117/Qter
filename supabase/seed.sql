-- QTER 問卷系統 - Supabase 測試數據
-- 用於開發和測試環境

-- ============================================================================
-- 清除現有數據 (僅用於開發環境)
-- ============================================================================

TRUNCATE TABLE response_items CASCADE;
TRUNCATE TABLE responses CASCADE;
TRUNCATE TABLE share_links CASCADE;
TRUNCATE TABLE forms CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================================================
-- 插入測試用戶
-- ============================================================================

-- 注意：在實際環境中，密碼應該使用 bcrypt 加密
-- 這裡的 password_hash 是 'password123' 的 bcrypt hash (10 rounds)
INSERT INTO users (id, email, password_hash, created_at) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'admin@qter.dev', '$2b$10$N9qo8uLOickgx2ZMRZoMye4IjJQVfBnQsqHy9hZNv6oX9NU5p/G.q', NOW() - INTERVAL '30 days'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'user@qter.dev', '$2b$10$N9qo8uLOickgx2ZMRZoMye4IjJQVfBnQsqHy9hZNv6oX9NU5p/G.q', NOW() - INTERVAL '20 days'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'test@qter.dev', '$2b$10$N9qo8uLOickgx2ZMRZoMye4IjJQVfBnQsqHy9hZNv6oX9NU5p/G.q', NOW() - INTERVAL '10 days');

-- ============================================================================
-- 插入測試問卷
-- ============================================================================

INSERT INTO forms (id, user_id, title, description, markdown_content, questions, display_mode, status, created_at) VALUES
  (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    '產品使用者體驗調查',
    '幫助我們了解您的使用體驗，改進產品功能',
    '# 歡迎參與我們的問卷調查\n\n感謝您抽空填寫這份問卷，您的意見對我們非常重要！',
    '[
      {
        "id": "q1",
        "type": "text",
        "title": "請問您的姓名是？",
        "required": true
      },
      {
        "id": "q2",
        "type": "email",
        "title": "請提供您的電子郵件",
        "required": true
      },
      {
        "id": "q3",
        "type": "radio",
        "title": "您對我們的產品整體滿意度如何？",
        "required": true,
        "options": [
          {"label": "非常滿意", "value": "5"},
          {"label": "滿意", "value": "4"},
          {"label": "普通", "value": "3"},
          {"label": "不滿意", "value": "2"},
          {"label": "非常不滿意", "value": "1"}
        ]
      },
      {
        "id": "q4",
        "type": "checkbox",
        "title": "您最常使用哪些功能？（可多選）",
        "required": false,
        "options": [
          {"label": "問卷建立", "value": "create"},
          {"label": "數據分析", "value": "analytics"},
          {"label": "分享連結", "value": "share"},
          {"label": "匯出報告", "value": "export"}
        ]
      },
      {
        "id": "q5",
        "type": "textarea",
        "title": "您有什麼建議或意見嗎？",
        "required": false,
        "placeholder": "請輸入您的建議..."
      }
    ]'::jsonb,
    'step-by-step',
    'active',
    NOW() - INTERVAL '25 days'
  ),
  (
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    '員工滿意度調查 2025',
    '年度員工滿意度調查問卷',
    '# 2025 年度員工滿意度調查\n\n請誠實填寫，所有回答將完全保密。',
    '[
      {
        "id": "q1",
        "type": "radio",
        "title": "您在公司工作多久了？",
        "required": true,
        "options": [
          {"label": "少於 6 個月", "value": "lt6m"},
          {"label": "6 個月 - 1 年", "value": "6m-1y"},
          {"label": "1-3 年", "value": "1-3y"},
          {"label": "3-5 年", "value": "3-5y"},
          {"label": "5 年以上", "value": "gt5y"}
        ]
      },
      {
        "id": "q2",
        "type": "range",
        "title": "工作環境滿意度 (1-10)",
        "required": true,
        "min": 1,
        "max": 10,
        "step": 1
      },
      {
        "id": "q3",
        "type": "range",
        "title": "薪資福利滿意度 (1-10)",
        "required": true,
        "min": 1,
        "max": 10,
        "step": 1
      },
      {
        "id": "q4",
        "type": "textarea",
        "title": "您認為公司可以改進的地方？",
        "required": false
      }
    ]'::jsonb,
    'step-by-step',
    'active',
    NOW() - INTERVAL '15 days'
  ),
  (
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    '活動報名表',
    '2025 春季研討會報名',
    '# 2025 春季研討會\n\n歡迎報名參加！',
    '[
      {
        "id": "q1",
        "type": "text",
        "title": "姓名",
        "required": true
      },
      {
        "id": "q2",
        "type": "email",
        "title": "電子郵件",
        "required": true
      },
      {
        "id": "q3",
        "type": "tel",
        "title": "聯絡電話",
        "required": true
      },
      {
        "id": "q4",
        "type": "radio",
        "title": "參加場次",
        "required": true,
        "options": [
          {"label": "上午場 (09:00-12:00)", "value": "morning"},
          {"label": "下午場 (14:00-17:00)", "value": "afternoon"}
        ]
      },
      {
        "id": "q5",
        "type": "checkbox",
        "title": "飲食偏好",
        "required": false,
        "options": [
          {"label": "素食", "value": "vegetarian"},
          {"label": "不吃牛肉", "value": "no_beef"},
          {"label": "不吃豬肉", "value": "no_pork"},
          {"label": "海鮮過敏", "value": "seafood_allergy"}
        ]
      }
    ]'::jsonb,
    'all-in-one',
    'active',
    NOW() - INTERVAL '5 days'
  ),
  (
    'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    '草稿問卷',
    '尚未完成的問卷',
    NULL,
    '[]'::jsonb,
    'step-by-step',
    'draft',
    NOW() - INTERVAL '2 days'
  );

-- ============================================================================
-- 插入分享連結
-- ============================================================================

INSERT INTO share_links (id, form_id, hash, is_enabled, allow_anonymous, expire_at, max_responses, created_at) VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    'ux-survey-2025',
    TRUE,
    TRUE,
    NOW() + INTERVAL '30 days',
    NULL,
    NOW() - INTERVAL '25 days'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid,
    'employee-survey-2025',
    TRUE,
    FALSE,
    NOW() + INTERVAL '60 days',
    NULL,
    NOW() - INTERVAL '15 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,
    'spring-workshop-2025',
    TRUE,
    TRUE,
    NOW() + INTERVAL '15 days',
    100,
    NOW() - INTERVAL '5 days'
  ),
  (
    '44444444-4444-4444-4444-444444444444'::uuid,
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    'expired-link',
    TRUE,
    TRUE,
    NOW() - INTERVAL '5 days',
    NULL,
    NOW() - INTERVAL '30 days'
  ),
  (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid,
    'disabled-link',
    FALSE,
    TRUE,
    NULL,
    NULL,
    NOW() - INTERVAL '10 days'
  );

-- ============================================================================
-- 插入測試回應
-- ============================================================================

INSERT INTO responses (id, form_id, share_link_id, respondent_user_id, respondent_hash, submitted_at, meta_json) VALUES
  (
    'r1111111-1111-1111-1111-111111111111'::uuid,
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    'anon-user-001',
    NOW() - INTERVAL '20 days',
    '{"ip": "192.168.1.100", "userAgent": "Mozilla/5.0"}'::jsonb
  ),
  (
    'r2222222-2222-2222-2222-222222222222'::uuid,
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    NULL,
    NOW() - INTERVAL '18 days',
    '{"ip": "192.168.1.101", "userAgent": "Mozilla/5.0"}'::jsonb
  ),
  (
    'r3333333-3333-3333-3333-333333333333'::uuid,
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
    NULL,
    NOW() - INTERVAL '10 days',
    '{"ip": "192.168.1.102"}'::jsonb
  ),
  (
    'r4444444-4444-4444-4444-444444444444'::uuid,
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    NULL,
    'anon-user-002',
    NOW() - INTERVAL '3 days',
    '{"ip": "192.168.1.103"}'::jsonb
  ),
  (
    'r5555555-5555-5555-5555-555555555555'::uuid,
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    'anon-user-003',
    NOW() - INTERVAL '1 day',
    '{"ip": "192.168.1.104"}'::jsonb
  );

-- ============================================================================
-- 插入回應項目
-- ============================================================================

-- Response 1 的答案 (產品使用者體驗調查)
INSERT INTO response_items (response_id, question_id, value_text, value_number, value_json) VALUES
  ('r1111111-1111-1111-1111-111111111111'::uuid, 'q1', '張小明', NULL, NULL),
  ('r1111111-1111-1111-1111-111111111111'::uuid, 'q2', 'ming@example.com', NULL, NULL),
  ('r1111111-1111-1111-1111-111111111111'::uuid, 'q3', '5', 5, NULL),
  ('r1111111-1111-1111-1111-111111111111'::uuid, 'q4', NULL, NULL, '["create", "analytics"]'::jsonb),
  ('r1111111-1111-1111-1111-111111111111'::uuid, 'q5', '界面設計很直觀，希望能增加更多圖表類型', NULL, NULL);

-- Response 2 的答案 (產品使用者體驗調查)
INSERT INTO response_items (response_id, question_id, value_text, value_number, value_json) VALUES
  ('r2222222-2222-2222-2222-222222222222'::uuid, 'q1', '李小華', NULL, NULL),
  ('r2222222-2222-2222-2222-222222222222'::uuid, 'q2', 'hua@example.com', NULL, NULL),
  ('r2222222-2222-2222-2222-222222222222'::uuid, 'q3', '4', 4, NULL),
  ('r2222222-2222-2222-2222-222222222222'::uuid, 'q4', NULL, NULL, '["create", "share", "export"]'::jsonb),
  ('r2222222-2222-2222-2222-222222222222'::uuid, 'q5', '整體不錯，但載入速度可以再快一點', NULL, NULL);

-- Response 3 的答案 (員工滿意度調查)
INSERT INTO response_items (response_id, question_id, value_text, value_number, value_json) VALUES
  ('r3333333-3333-3333-3333-333333333333'::uuid, 'q1', '1-3y', NULL, NULL),
  ('r3333333-3333-3333-3333-333333333333'::uuid, 'q2', NULL, 8, NULL),
  ('r3333333-3333-3333-3333-333333333333'::uuid, 'q3', NULL, 7, NULL),
  ('r3333333-3333-3333-3333-333333333333'::uuid, 'q4', '希望能有更多的學習發展機會', NULL, NULL);

-- Response 4 的答案 (活動報名表)
INSERT INTO response_items (response_id, question_id, value_text, value_number, value_json) VALUES
  ('r4444444-4444-4444-4444-444444444444'::uuid, 'q1', '王大明', NULL, NULL),
  ('r4444444-4444-4444-4444-444444444444'::uuid, 'q2', 'daming@example.com', NULL, NULL),
  ('r4444444-4444-4444-4444-444444444444'::uuid, 'q3', '0912-345-678', NULL, NULL),
  ('r4444444-4444-4444-4444-444444444444'::uuid, 'q4', 'morning', NULL, NULL),
  ('r4444444-4444-4444-4444-444444444444'::uuid, 'q5', NULL, NULL, '["vegetarian"]'::jsonb);

-- Response 5 的答案 (產品使用者體驗調查)
INSERT INTO response_items (response_id, question_id, value_text, value_number, value_json) VALUES
  ('r5555555-5555-5555-5555-555555555555'::uuid, 'q1', '陳小芬', NULL, NULL),
  ('r5555555-5555-5555-5555-555555555555'::uuid, 'q2', 'fen@example.com', NULL, NULL),
  ('r5555555-5555-5555-5555-555555555555'::uuid, 'q3', '3', 3, NULL),
  ('r5555555-5555-5555-5555-555555555555'::uuid, 'q4', NULL, NULL, '["analytics"]'::jsonb),
  ('r5555555-5555-5555-5555-555555555555'::uuid, 'q5', '功能還行，但有時會遇到一些小 bug', NULL, NULL);

-- ============================================================================
-- 驗證數據
-- ============================================================================

-- 顯示插入的數據統計
DO $$
DECLARE
  user_count INTEGER;
  form_count INTEGER;
  link_count INTEGER;
  response_count INTEGER;
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO form_count FROM forms;
  SELECT COUNT(*) INTO link_count FROM share_links;
  SELECT COUNT(*) INTO response_count FROM responses;
  SELECT COUNT(*) INTO item_count FROM response_items;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'QTER 測試數據插入完成';
  RAISE NOTICE '========================================';
  RAISE NOTICE '用戶數量: %', user_count;
  RAISE NOTICE '問卷數量: %', form_count;
  RAISE NOTICE '分享連結數量: %', link_count;
  RAISE NOTICE '回應數量: %', response_count;
  RAISE NOTICE '回應項目數量: %', item_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 測試查詢範例
-- ============================================================================

-- 查詢某個用戶的所有問卷
-- SELECT * FROM forms WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- 查詢某個問卷的統計數據
-- SELECT * FROM get_form_response_stats('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid);

-- 查詢某個分享連結的問卷資訊
-- SELECT * FROM get_form_by_share_link('ux-survey-2025');

-- 查詢某個問卷的所有回應和答案
-- SELECT
--   r.id AS response_id,
--   r.submitted_at,
--   r.respondent_hash,
--   u.email AS respondent_email,
--   ri.question_id,
--   ri.value_text,
--   ri.value_number,
--   ri.value_json
-- FROM responses r
-- LEFT JOIN users u ON r.respondent_user_id = u.id
-- JOIN response_items ri ON ri.response_id = r.id
-- WHERE r.form_id = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid
-- ORDER BY r.submitted_at DESC, ri.question_id;
