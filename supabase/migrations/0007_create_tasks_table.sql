create table tasks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  title text not null,
  assignee_name text,
  deadline timestamptz,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'review', 'revision', 'completed', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table tasks enable row level security;

create policy "Users can view tasks in their workspaces"
on tasks for select to authenticated
using (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = tasks.workspace_id
    and workspace_members.user_id = auth.uid()
  )
);

create policy "Users can insert tasks in their workspaces"
on tasks for insert to authenticated
with check (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = workspace_id
    and workspace_members.user_id = auth.uid()
  )
);

create policy "Users can update tasks in their workspaces"
on tasks for update to authenticated
using (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = tasks.workspace_id
    and workspace_members.user_id = auth.uid()
  )
);

create policy "Users can delete tasks in their workspaces"
on tasks for delete to authenticated
using (
  exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = tasks.workspace_id
    and workspace_members.user_id = auth.uid()
  )
);
