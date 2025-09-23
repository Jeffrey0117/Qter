-- 創建上傳檔案記錄表
CREATE TABLE IF NOT EXISTS uploaded_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外鍵約束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 索引
    INDEX idx_user_files (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_mime_type (mime_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 創建表單回應檔案關聯表（用於 file_upload 題型）
CREATE TABLE IF NOT EXISTS response_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    file_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外鍵約束
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
    
    -- 複合唯一索引，確保同一個回應的同一題目不會重複關聯相同檔案
    UNIQUE KEY unique_response_question_file (response_id, question_id, file_id),
    
    -- 索引
    INDEX idx_response_files (response_id),
    INDEX idx_question_files (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加檔案上傳題型到 questions 表的 question_type 欄位（如果還沒有）
-- 注意：file_upload 應該已經包含在 question_type ENUM 中