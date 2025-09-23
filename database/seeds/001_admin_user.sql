-- 插入預設管理員使用者
-- 密碼為 'admin123' 的 bcrypt 雜湊 (請在生產環境中更改)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@example.com', '$2b$10$rOzJh4VzQXvQJzKJY8pHae.KwQXvQJzKJY8pHae.KwQXvQJzKJY8pH', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 插入範例表單
INSERT INTO forms (title, description, creator_id, published, settings) VALUES
('客戶滿意度調查', '請協助我們了解您的使用體驗', 1, true, '{"allow_anonymous": true, "show_progress": true}'),
('活動報名表單', '請填寫以下資訊完成報名', 1, true, '{"deadline": "2025-12-31", "max_responses": 100}')
ON CONFLICT DO NOTHING;

-- 插入範例題目 (客戶滿意度調查)
INSERT INTO questions (form_id, question_text, question_type, required, options, order_index) VALUES
(1, '您的整體滿意度如何？', 'single_choice', true, '["非常滿意", "滿意", "普通", "不滿意", "非常不滿意"]', 1),
(1, '您最喜歡我們產品的哪一點？', 'multiple_choice', false, '["品質", "價格", "服務", "設計", "功能"]', 2),
(1, '請提供改進建議', 'long_answer', false, '[]', 3),
(1, '您會推薦我們給朋友嗎？', 'single_choice', true, '["一定會", "可能會", "不會", "絕對不會"]', 4);

-- 插入範例題目 (活動報名表單)
INSERT INTO questions (form_id, question_text, question_type, required, options, order_index) VALUES
(2, '您的姓名', 'short_answer', true, '[]', 1),
(2, '您的電子郵件', 'short_answer', true, '[]', 2),
(2, '您的手機號碼', 'short_answer', true, '[]', 3),
(2, '您參加的活動場次', 'single_choice', true, '["上午場", "下午場", "晚上場"]', 4),
(2, '特殊飲食需求', 'short_answer', false, '[]', 5),
(2, '上傳個人照片 (可選)', 'file_upload', false, '[]', 6);