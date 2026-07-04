-- Add second video source URL column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS video_url_2 TEXT;
