-- Migration for Milestone 4: Marketing Data Schema

-- 1. campaigns
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  status text default 'active',
  start_date date,
  end_date date,
  budget numeric default 0,
  created_at timestamptz default now()
);

-- 2. products
create table products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  sku text,
  price numeric,
  created_at timestamptz default now()
);

-- 3. creative_briefs
create table creative_briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  created_by uuid references auth.users(id),
  
  title text not null,
  audience text,
  pain_point text,
  hook text,
  angle text,
  offer text,
  cta text,
  platform text, -- TikTok, Facebook, etc.
  deadline date,
  status text default 'draft', -- draft, approved, active, completed
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. video_ads
create table video_ads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  brief_id uuid references creative_briefs(id) on delete set null,
  
  title text not null,
  version text default 'v1',
  hook text,
  angle text,
  platform text,
  
  final_asset_id uuid references media_assets(id) on delete set null,
  thumbnail_asset_id uuid references media_assets(id) on delete set null,
  
  approval_status text default 'draft', -- draft, review, approved, rejected
  launch_status text default 'not_launched', -- not_launched, launched, paused
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BẬT ROW LEVEL SECURITY (RLS) VÀ POLICIES

alter table campaigns enable row level security;
alter table products enable row level security;
alter table creative_briefs enable row level security;
alter table video_ads enable row level security;

-- Policies
create policy "Workspace members can view campaigns" on campaigns for select using (is_workspace_member(workspace_id));
create policy "Workspace members can insert campaigns" on campaigns for insert with check (is_workspace_member(workspace_id));
create policy "Workspace members can update campaigns" on campaigns for update using (is_workspace_member(workspace_id));

create policy "Workspace members can view products" on products for select using (is_workspace_member(workspace_id));
create policy "Workspace members can insert products" on products for insert with check (is_workspace_member(workspace_id));
create policy "Workspace members can update products" on products for update using (is_workspace_member(workspace_id));

create policy "Workspace members can view creative_briefs" on creative_briefs for select using (is_workspace_member(workspace_id));
create policy "Workspace members can insert creative_briefs" on creative_briefs for insert with check (is_workspace_member(workspace_id));
create policy "Workspace members can update creative_briefs" on creative_briefs for update using (is_workspace_member(workspace_id));

create policy "Workspace members can view video_ads" on video_ads for select using (is_workspace_member(workspace_id));
create policy "Workspace members can insert video_ads" on video_ads for insert with check (is_workspace_member(workspace_id));
create policy "Workspace members can update video_ads" on video_ads for update using (is_workspace_member(workspace_id));
