-- Add created_at column to check_list_sets table
ALTER TABLE check_list_sets ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
