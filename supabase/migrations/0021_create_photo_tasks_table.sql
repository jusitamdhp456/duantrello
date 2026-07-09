-- =============================================
-- 0021: Create Photo Tasks Table and Comments
-- =============================================

-- 1. Create photo_tasks table
create table photo_tasks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  title text not null,
  assignee_name text,
  assignee_id uuid references auth.users(id) on delete set null,
  deadline timestamptz,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'review', 'revision', 'completed', 'cancelled')),
  video_url text,
  video_url_2 text,
  product_url text,
  review_status text default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table photo_tasks enable row level security;

create policy "Users can view photo_tasks in their workspaces"
on photo_tasks for select to authenticated
using (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = photo_tasks.workspace_id
    and workspace_members.user_id = auth.uid()
  )
);

create policy "Users can insert photo_tasks in their workspaces"
on photo_tasks for insert to authenticated
with check (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = workspace_id
    and workspace_members.user_id = auth.uid()
  )
);

create policy "Users can update photo_tasks in their workspaces"
on photo_tasks for update to authenticated
using (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = photo_tasks.workspace_id
    and workspace_members.user_id = auth.uid()
  )
);

create policy "Users can delete photo_tasks in their workspaces"
on photo_tasks for delete to authenticated
using (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = photo_tasks.workspace_id
    and workspace_members.user_id = auth.uid()
  )
);

-- 2. Create photo_task_comments table
CREATE TABLE public.photo_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.photo_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookup by task_id
CREATE INDEX idx_photo_task_comments_task_id ON photo_task_comments(task_id);

-- Trigger to update updated_at
CREATE TRIGGER photo_task_comments_updated_at
  BEFORE UPDATE ON photo_task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE photo_task_comments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for photo_task_comments (Open to all authenticated users)
CREATE POLICY "Anyone can view photo task comments" ON photo_task_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can insert photo task comments" ON photo_task_comments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own photo comments" ON photo_task_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own photo comments" ON photo_task_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());
