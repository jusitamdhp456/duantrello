-- Add description column to photo_tasks
ALTER TABLE photo_tasks ADD COLUMN IF NOT EXISTS description TEXT;
