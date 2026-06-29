-- Cấu trúc bảng Supabase cho Marketing Creative OS

-- 1. workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. profiles (mở rộng thông tin user)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. workspace_members
create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 4. boards
create table boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- 5. lists
create table lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  name text not null,
  position integer default 0,
  created_at timestamptz default now()
);

-- 6. cards
create table cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references lists(id) on delete cascade,
  title text not null,
  description text,
  position integer default 0,
  created_at timestamptz default now()
);

-- 7. media_assets
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  
  file_name text not null,
  file_type text not null,
  mime_type text,
  file_size bigint,
  
  r2_bucket text not null,
  r2_object_key text not null,
  
  asset_type text,
  status text default 'active',
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==============================================================================
-- BẬT ROW LEVEL SECURITY (RLS) VÀ POLICIES
-- ==============================================================================

alter table workspaces enable row level security;
alter table profiles enable row level security;
alter table workspace_members enable row level security;
alter table boards enable row level security;
alter table lists enable row level security;
alter table cards enable row level security;
alter table media_assets enable row level security;

-- Function tiện ích: Kiểm tra user có thuộc workspace không
create or replace function public.is_workspace_member(workspace_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from workspace_members
    where workspace_members.workspace_id = is_workspace_member.workspace_id
    and workspace_members.user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Policies cho workspaces
create policy "Users can view workspaces they belong to"
on workspaces for select using (is_workspace_member(id));

-- Policies cho profiles
create policy "Users can view all profiles"
on profiles for select using (true);

create policy "Users can update their own profile"
on profiles for update using (auth.uid() = id);

-- Policies cho workspace_members
create policy "Users can view members of their workspaces"
on workspace_members for select using (is_workspace_member(workspace_id));

-- Policies cho boards
create policy "Workspace members can view boards"
on boards for select using (is_workspace_member(workspace_id));

create policy "Workspace members can insert boards"
on boards for insert with check (is_workspace_member(workspace_id));

-- Policies cho lists (thông qua boards -> workspace_id)
create policy "Workspace members can view lists"
on lists for select using (
  exists (select 1 from boards where id = lists.board_id and is_workspace_member(workspace_id))
);

-- Policies cho cards (thông qua lists -> boards -> workspace_id)
create policy "Workspace members can view cards"
on cards for select using (
  exists (
    select 1 from lists l
    join boards b on b.id = l.board_id
    where l.id = cards.list_id and is_workspace_member(b.workspace_id)
  )
);

-- Policies cho media_assets
create policy "Workspace members can view media assets"
on media_assets for select using (is_workspace_member(workspace_id));

create policy "Workspace members can insert media assets"
on media_assets for insert with check (is_workspace_member(workspace_id));

create policy "Workspace members can update media assets"
on media_assets for update using (is_workspace_member(workspace_id));
