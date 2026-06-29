-- Migration for Milestone 3: Task Management Core (Trello-like features)

-- 1. card_labels
create table card_labels (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  name text not null,
  color text, -- e.g., 'red', 'blue', '#ff0000'
  created_at timestamptz default now()
);

-- Mapping table for cards and labels
create table cards_labels_map (
  card_id uuid references cards(id) on delete cascade,
  label_id uuid references card_labels(id) on delete cascade,
  primary key (card_id, label_id)
);

-- 2. card_members
create table card_members (
  card_id uuid references cards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (card_id, user_id)
);

-- 3. card_checklists
create table card_checklists (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  title text not null,
  position integer default 0,
  created_at timestamptz default now()
);

-- 4. card_checklist_items
create table card_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid references card_checklists(id) on delete cascade,
  content text not null,
  is_completed boolean default false,
  position integer default 0,
  created_at timestamptz default now()
);

-- 5. card_comments
create table card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. card_attachments
create table card_attachments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  media_asset_id uuid references media_assets(id) on delete cascade,
  created_at timestamptz default now()
);

-- ==============================================================================
-- BẬT ROW LEVEL SECURITY (RLS) VÀ POLICIES
-- ==============================================================================

alter table card_labels enable row level security;
alter table cards_labels_map enable row level security;
alter table card_members enable row level security;
alter table card_checklists enable row level security;
alter table card_checklist_items enable row level security;
alter table card_comments enable row level security;
alter table card_attachments enable row level security;

-- Thêm quyền select
create policy "Workspace members can view card labels" on card_labels
for select using (exists (select 1 from boards where id = card_labels.board_id and is_workspace_member(workspace_id)));

create policy "Workspace members can view card labels map" on cards_labels_map
for select using (exists (
  select 1 from cards c join lists l on c.list_id = l.id join boards b on l.board_id = b.id 
  where c.id = cards_labels_map.card_id and is_workspace_member(b.workspace_id)
));

create policy "Workspace members can view card members" on card_members
for select using (exists (
  select 1 from cards c join lists l on c.list_id = l.id join boards b on l.board_id = b.id 
  where c.id = card_members.card_id and is_workspace_member(b.workspace_id)
));

create policy "Workspace members can view card checklists" on card_checklists
for select using (exists (
  select 1 from cards c join lists l on c.list_id = l.id join boards b on l.board_id = b.id 
  where c.id = card_checklists.card_id and is_workspace_member(b.workspace_id)
));

create policy "Workspace members can view card checklist items" on card_checklist_items
for select using (exists (
  select 1 from card_checklists cc join cards c on cc.card_id = c.id join lists l on c.list_id = l.id join boards b on l.board_id = b.id 
  where cc.id = card_checklist_items.checklist_id and is_workspace_member(b.workspace_id)
));

create policy "Workspace members can view card comments" on card_comments
for select using (exists (
  select 1 from cards c join lists l on c.list_id = l.id join boards b on l.board_id = b.id 
  where c.id = card_comments.card_id and is_workspace_member(b.workspace_id)
));

create policy "Workspace members can view card attachments" on card_attachments
for select using (exists (
  select 1 from cards c join lists l on c.list_id = l.id join boards b on l.board_id = b.id 
  where c.id = card_attachments.card_id and is_workspace_member(b.workspace_id)
));

-- Cho phép INSERT/UPDATE/DELETE cho Lists và Cards (Rất quan trọng cho Milestone 3)
create policy "Workspace members can insert lists" on lists for insert with check (exists (select 1 from boards where id = board_id and is_workspace_member(workspace_id)));
create policy "Workspace members can update lists" on lists for update using (exists (select 1 from boards where id = board_id and is_workspace_member(workspace_id)));
create policy "Workspace members can delete lists" on lists for delete using (exists (select 1 from boards where id = board_id and is_workspace_member(workspace_id)));

create policy "Workspace members can insert cards" on cards for insert with check (exists (select 1 from lists join boards on lists.board_id = boards.id where lists.id = list_id and is_workspace_member(boards.workspace_id)));
create policy "Workspace members can update cards" on cards for update using (exists (select 1 from lists join boards on lists.board_id = boards.id where lists.id = list_id and is_workspace_member(boards.workspace_id)));
create policy "Workspace members can delete cards" on cards for delete using (exists (select 1 from lists join boards on lists.board_id = boards.id where lists.id = list_id and is_workspace_member(boards.workspace_id)));
