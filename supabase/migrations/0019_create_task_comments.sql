-- =============================================
-- 0019: Create Task Comments Table and Storage
-- =============================================

-- 1. Create task_comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookup by task_id
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- Trigger to update updated_at
CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for task_comments (Open to all authenticated users)
CREATE POLICY "Anyone can view task comments" ON task_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can insert task comments" ON task_comments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- 3. Cấu hình bucket cho ảnh task comments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_comments', 'task_comments', true)
ON CONFLICT (id) DO NOTHING;

-- Xóa policies cũ nếu có
DROP POLICY IF EXISTS "Task comments images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload task comments images." ON storage.objects;
DROP POLICY IF EXISTS "Users can update task comments images." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete task comments images." ON storage.objects;

-- Thiết lập lại policies cho bucket
CREATE POLICY "Task comments images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'task_comments');

CREATE POLICY "Users can upload task comments images."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task_comments');

CREATE POLICY "Users can update task comments images."
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'task_comments');

CREATE POLICY "Users can delete task comments images."
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task_comments');
