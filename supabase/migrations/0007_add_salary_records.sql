-- Bảng lưu lịch sử hoàn thành clip để tính lương cá nhân
create table if not exists salary_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  clip_title text not null,
  completed_at timestamptz not null default now(),
  period_year integer not null,   -- năm
  period_month integer not null,  -- tháng (1-12)
  clip_count_in_month integer not null default 1,  -- clip thứ mấy trong tháng này
  rate_per_clip integer not null, -- đơn giá tại thời điểm hoàn thành (VND)
  created_at timestamptz default now()
);

alter table salary_records enable row level security;

-- Chỉ bản thân được xem lương của mình
create policy "Users can view their own salary records"
on salary_records for select using (auth.uid() = user_id);

-- Thành viên workspace có thể thêm record
create policy "Users can insert their own salary records"
on salary_records for insert with check (auth.uid() = user_id);

-- Thành viên workspace có thể xóa record của mình
create policy "Users can delete their own salary records"
on salary_records for delete using (auth.uid() = user_id);
