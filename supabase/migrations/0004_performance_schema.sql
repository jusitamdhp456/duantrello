-- Migration for Milestone 5: Performance Metrics & People Scoring

-- 1. ad_metrics
create table ad_metrics (
  id uuid primary key default gen_random_uuid(),
  video_ad_id uuid references video_ads(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  date_recorded date default CURRENT_DATE,
  spend numeric default 0,
  impressions integer default 0,
  clicks integer default 0,
  conversions integer default 0,
  roas numeric default 0,
  created_at timestamptz default now(),
  unique(video_ad_id, date_recorded)
);

-- 2. user_scores
create table user_scores (
  user_id uuid references auth.users(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  total_score integer default 0,
  updated_at timestamptz default now(),
  primary key (user_id, workspace_id)
);

-- 3. score_logs
create table score_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz default now()
);

-- BẬT ROW LEVEL SECURITY (RLS) VÀ POLICIES

alter table ad_metrics enable row level security;
alter table user_scores enable row level security;
alter table score_logs enable row level security;

-- Policies for ad_metrics
create policy "Workspace members can view ad metrics" on ad_metrics for select using (is_workspace_member(workspace_id));
create policy "Workspace members can insert ad metrics" on ad_metrics for insert with check (is_workspace_member(workspace_id));
create policy "Workspace members can update ad metrics" on ad_metrics for update using (is_workspace_member(workspace_id));

-- Policies for user_scores
create policy "Workspace members can view user scores" on user_scores for select using (is_workspace_member(workspace_id));
create policy "Workspace members can insert user scores" on user_scores for insert with check (is_workspace_member(workspace_id));
create policy "Workspace members can update user scores" on user_scores for update using (is_workspace_member(workspace_id));

-- Policies for score_logs
create policy "Workspace members can view score logs" on score_logs for select using (is_workspace_member(workspace_id));
create policy "Workspace members can insert score logs" on score_logs for insert with check (is_workspace_member(workspace_id));

-- Function to safely award points (useful to call from server actions)
create or replace function public.award_user_points(
  p_user_id uuid,
  p_workspace_id uuid,
  p_amount integer,
  p_reason text
) returns void
language plpgsql
security definer set search_path = public
as $$
begin
  -- Insert or update user score
  insert into public.user_scores (user_id, workspace_id, total_score)
  values (p_user_id, p_workspace_id, p_amount)
  on conflict (user_id, workspace_id)
  do update set 
    total_score = user_scores.total_score + p_amount,
    updated_at = now();

  -- Log the score
  insert into public.score_logs (user_id, workspace_id, amount, reason)
  values (p_user_id, p_workspace_id, p_amount, p_reason);
end;
$$;
