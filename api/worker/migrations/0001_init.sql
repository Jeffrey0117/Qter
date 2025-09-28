-- Initial schema for QTER
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  markdown_content TEXT,
  display_mode TEXT DEFAULT 'step-by-step',
  show_progress_bar INTEGER DEFAULT 1,
  enable_auto_advance INTEGER DEFAULT 0,
  advance_delay INTEGER DEFAULT 3,
  allow_back_navigation INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  is_enabled INTEGER DEFAULT 1,
  allow_anonymous INTEGER DEFAULT 1,
  expire_at DATETIME,
  max_responses INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id)
);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  share_link_id TEXT,
  respondent_user_id TEXT,
  respondent_hash TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  meta_json TEXT,
  FOREIGN KEY (form_id) REFERENCES forms(id),
  FOREIGN KEY (share_link_id) REFERENCES share_links(id),
  FOREIGN KEY (respondent_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS response_items (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_json TEXT,
  FOREIGN KEY (response_id) REFERENCES responses(id)
);

-- Indexes for performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_share_links_hash ON share_links(hash);
CREATE INDEX idx_responses_form_id ON responses(form_id);
CREATE INDEX idx_response_items_response_id ON response_items(response_id);