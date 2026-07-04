-- Create the task_comments bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task_comments', 'task_comments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket (if not already enabled)
-- storage.objects already has RLS enabled by default in Supabase

-- Allow public read access to the bucket
CREATE POLICY "Public Read Access Task Comments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'task_comments');

-- Allow authenticated users to upload files
CREATE POLICY "Auth Users Upload Task Comments" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'task_comments');

-- Allow authenticated users to update files
CREATE POLICY "Auth Users Update Task Comments" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'task_comments');

-- Allow authenticated users to delete files
CREATE POLICY "Auth Users Delete Task Comments" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'task_comments');
