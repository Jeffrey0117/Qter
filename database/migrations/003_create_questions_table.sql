-- 創建題目表
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('short_answer', 'long_answer', 'single_choice', 'multiple_choice', 'file_upload')),
    required BOOLEAN DEFAULT FALSE,
    options JSONB DEFAULT '[]',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 創建更新時間觸發器
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_questions_form_order ON questions(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);