-- Add image_urls array column to photo_tasks
ALTER TABLE photo_tasks ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
