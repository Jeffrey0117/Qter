-- 創建表單表
CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'
);

-- 創建更新時間觸發器
CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_forms_creator_id ON forms(creator_id);
CREATE INDEX IF NOT EXISTS idx_forms_published ON forms(published);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);