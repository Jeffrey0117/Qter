-- Add missing fields to forms table for survey sync feature
ALTER TABLE forms ADD COLUMN questions TEXT;
ALTER TABLE forms ADD COLUMN auto_advance INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN auto_advance_delay INTEGER DEFAULT 300;
ALTER TABLE forms ADD COLUMN show_progress INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN allow_go_back INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN status TEXT DEFAULT 'active';